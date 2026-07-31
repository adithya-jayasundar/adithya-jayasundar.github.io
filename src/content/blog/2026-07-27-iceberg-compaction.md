---
title: "Compacting Apache Iceberg Tables: Understanding Performance Beyond Small Files"
date: "2026-07-27"
summary: "Understanding why Apache Iceberg tables become slower over time, how compaction works, and the engineering trade-offs behind file sizing."
tags: ["apache-iceberg", "compaction", "data-engineering", "lakehouse", "performance", "scalability", "reliable-systems"]
---

# From Architecture to Maintenance

In the previous post, we looked at why Apache Iceberg exists and how its layered metadata architecture enables transactional guarantees on top of object storage.

However, understanding the architecture naturally raises another question.

If Iceberg already stores metadata efficiently and keeps track of every file through manifests and snapshots, why do production systems still require maintenance operations such as **compaction**?

The answer lies in the nature of analytical workloads themselves.

Every write changes the physical layout of the table. Left unmanaged, that layout gradually becomes less efficient, increasing both planning time and query execution time.

Compaction exists to restore that efficiency.

---

# The Small File Problem

Imagine an application continuously writing data into an Iceberg table.

In production this rarely happens as one massive batch.

Instead, data arrives as:

- Streaming events
- Hourly ETL jobs
- Incremental CDC pipelines
- Micro-batches from Spark or Flink
- Frequent inserts throughout the day

Each write creates one or more new Parquet files.

Suppose every job writes only 10 MB.

```
10 MB
10 MB
10 MB
10 MB
10 MB
...
```

After a few thousand executions, the table may contain thousands of tiny Parquet files.

The total data volume may only be 100 GB, but instead of a few hundred files, the table now contains tens of thousands.

This is known as the **small file problem**.

---

# Why Small Files Hurt Performance

At first glance, reading 100 GB is still reading 100 GB.

So why should the number of files matter?

Because every file introduces overhead.

For every file, the query engine must:

1. Read Iceberg metadata.
2. Open an object from S3.
3. Read the Parquet footer.
4. Allocate tasks.
5. Schedule execution.

Opening 10,000 files is significantly more expensive than opening 200 files, even if the total amount of data is identical.

Small files therefore increase:

- Query planning time
- Object storage requests
- Network latency
- Scheduler overhead
- Metadata scanning

Eventually, the CPU spends more time coordinating work than actually processing data.

---

# Metadata Also Grows

The impact isn't limited to Parquet files.

Remember the Iceberg architecture from Part 1.

```
Catalog
    ↓
Metadata File
    ↓
Manifest List
    ↓
Manifest Files
    ↓
Parquet Files
```

Every newly written data file appears inside a manifest.

More data files therefore mean:

- larger manifest files
- more manifests
- larger metadata trees

Before a query even reaches the Parquet files, Iceberg has more metadata to process.

Planning becomes slower long before scanning begins.

---

# Why Not Just Create Huge Files?

If small files are bad, why not simply create enormous Parquet files?

Because extremely large files introduce a different problem.

Imagine a 20 GB Parquet file.

Now a Spark cluster with hundreds of executors cannot easily split that work.

One executor may spend several minutes processing a single giant file while the rest of the cluster waits.

Large files reduce parallelism.

Even predicate pushdown becomes less effective because unrelated data is packed together.

Compaction therefore isn't about producing the largest possible files.

It is about producing files that are **large enough to minimize metadata overhead while remaining small enough to preserve parallelism**.

---

# The Hidden Trade-off: File Size vs Row Group Size

Another important distinction is that **file size** and **row group size** are not the same thing.

A Parquet file contains one or more row groups.

```
Parquet File

├── Row Group 1
├── Row Group 2
├── Row Group 3
└── Row Group 4
```

The row group is the unit used for column pruning and predicate pushdown.

The file is the unit managed by Iceberg.

These two sizes solve different problems.

### Larger row groups

Advantages:

- Better compression
- Sequential reads
- Lower metadata overhead

Disadvantages:

- Less granular pruning
- More unnecessary data may be scanned

### Smaller row groups

Advantages:

- Better predicate pruning
- More selective reads

Disadvantages:

- Larger Parquet footers
- More metadata
- Reduced compression

Similarly, larger files reduce Iceberg metadata overhead, while smaller files increase scheduling flexibility.

Choosing these values is therefore always a trade-off rather than an optimization in one direction.

---

# Delete Files Make Things Worse

If the table uses Merge-on-Read (MoR), another source of fragmentation appears.

Instead of rewriting data files immediately, Iceberg creates delete files.

```
Data File A

↓

Delete File

↓

Delete File

↓

Delete File
```

Every read must now merge the original data file with multiple delete files.

As updates accumulate, read performance gradually decreases.

Compaction periodically rewrites these delete files back into clean data files.

---

# What Compaction Actually Does

Conceptually, compaction is surprisingly simple.

```
Before

5000 small files

↓

Read

↓

Rewrite

↓

200 optimized files

↓

Commit new snapshot
```

The important detail is that Iceberg never modifies existing files.

Instead, it writes new optimized files and commits a new snapshot.

Readers continue using the old snapshot until the new one is committed atomically.

---

# Partial Progress

One challenge with very large tables is that compaction itself can become expensive.

Rewriting tens of terabytes of data may take hours.

If a job fails after processing 90% of the table, restarting from the beginning wastes significant time and compute resources.

Modern Iceberg implementations therefore support **partial progress** during rewrite operations.

Instead of treating compaction as one enormous transaction, the rewrite can be divided into smaller groups of files.

Each successfully rewritten group is committed independently.

```
Rewrite Group 1

✓ Commit

↓

Rewrite Group 2

✓ Commit

↓

Rewrite Group 3

✗ Failure
```

If the job fails, only the unfinished portion needs to be retried.

This makes long-running maintenance operations significantly more reliable.

The trade-off is that readers may temporarily observe a table where only part of the planned optimization has completed. The table remains fully consistent because each partial commit is atomic, but the final optimized layout is achieved over multiple commits instead of one.

---

# Compaction Is Really About Physical Layout

When I first heard the word *compaction*, I imagined it simply meant "merge small files."

After understanding Iceberg internals, I realized the objective is much broader.

Compaction is really about maintaining the **physical organization** of a table.

It balances:

- metadata size
- query planning overhead
- object storage requests
- parallelism
- compression
- predicate pruning
- delete file accumulation

All of these factors determine whether a table continues to perform well as it grows from gigabytes to petabytes.

# Closing Thoughts

When I first started this activity, I thought compaction was simply about merging small Parquet files into larger ones. After spending time understanding Apache Iceberg, I realized that compaction is only one piece of a much larger story.

It forced me to understand why OLTP databases excel at transactional workloads but struggle with analytical queries, why organizations moved toward data warehouses, why data lakes emerged as a more economical alternative, and how open table formats like Apache Iceberg bridge the gap between flexibility and reliability. Along the way, concepts like columnar storage, row groups, manifests, snapshots, catalogs, and metadata stopped being isolated pieces of terminology and instead became parts of a single architecture designed to solve real-world problems at scale.

Perhaps the biggest takeaway for me was that performance in modern analytical systems isn't determined solely by hardware or compute power. The physical organization of data—how files are written, how metadata is managed, and how tables evolve over time—plays an equally important role. Compaction is one of the mechanisms that keeps this organization healthy, ensuring that an Iceberg table continues to perform efficiently as data grows.

Working through this activity gave me a much deeper appreciation for the engineering decisions behind modern lakehouse systems. What began as a maintenance task eventually became an opportunity to understand the evolution of analytical data platforms—from traditional OLTP systems to today's open, scalable, and cloud-native architectures.

For someone coming from an AI engineering background, it was a reminder that building intelligent systems isn't just about training better models. It's equally about understanding the data platforms that make those models possible.
