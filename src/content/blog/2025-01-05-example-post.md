---
title: "From OLTP to Lakehouse: Understanding Apache Iceberg Through a Real Compaction Task"
date: "2026-07-26"
summary: "Why Apache Iceberg exists, how modern data platforms evolved, and why understanding that evolution made my first Apache Iceberg compaction task much more meaningful."
tags: ["apache-iceberg", "data-engineering", "lakehouse", "olap", "oltp", "aws", "eks"]
---

## Why this post?

Recently, I was assigned an engineering task that initially sounded straightforward: perform compaction on an Apache Iceberg table running on Amazon EKS.

As an AI Engineer, I don't spend most of my time building data platforms. My work usually revolves around developing AI systems and deploying machine learning applications. However, working closely with data engineers in the aviation domain has made me realize that reliable AI systems begin long before the first model is trained.

The aviation industry continuously generates enormous volumes of operational data—flight schedules, cargo bookings, shipment movements, capacity updates, pricing events, and many other transactional records. Before this data becomes useful for dashboards or machine learning models, it has to be collected, cleaned, transformed, governed, modeled, optimized, and exposed for downstream consumption. That responsibility largely belongs to data engineering.

When I was asked to compact an Apache Iceberg table, I quickly realized that understanding the procedure required much more than learning a maintenance command. It required understanding **why modern analytical data platforms exist**, how they evolved from traditional databases, and what problems Apache Iceberg was originally designed to solve.

This post is my attempt to document that learning journey.

The ideas in this post are inspired by *Apache Iceberg: The Definitive Guide* alongside my own experience while working on this compaction activity. *Apache Iceberg: The Definitive Guide: Data Lakehouse Functionality, Performance, and Scalability on the Data Lake*

---

# Why OLTP Isn't Enough

In most organizations, the split between **OLTP (Online Transaction Processing)** and **OLAP (Online Analytical Processing)** shapes the entire data platform.

OLTP powers applications—booking systems, payment gateways, inventory updates, authentication services, and operational databases. OLAP, on the other hand, powers analysts, business intelligence teams, and data scientists who ask questions like:

- How did revenue trend over the last quarter?
- Which flight routes consistently experience delays?
- Which customers generate the highest lifetime value?

Even as an AI engineer, I spend much of my time working alongside data engineers, and it's worth appreciating how much of the data ecosystem they own. Their work spans cleaning data, governing it, modeling it, exposing it for downstream access, and optimizing how it's stored and queried. In practice, this means collecting data from operational systems, transforming it through ETL pipelines, and landing it into a data warehouse, data lake, or lakehouse depending on the workload.

Take aviation data as an example.

Every minute there are flight status updates, cargo bookings, shipment scans, crew scheduling events, pricing changes, and operational alerts flowing through the system. These are exactly the kinds of workloads relational databases (RDBMS) were built for.

They are optimized to interact with **one row—or a small number of rows—at a time**.

Examples include:

- Inserting a new cargo booking
- Updating a flight status
- Reading a passenger record
- Cancelling a shipment

To support these workloads efficiently, relational databases store data in a **row-oriented layout**, where every column belonging to a row is stored together. Combined with normalization and transactional guarantees, this makes OLTP systems extremely fast and reliable for operational workloads.

The problem begins when we ask an entirely different kind of question.

Imagine trying to analyze delay patterns across every airline, every airport, and every season over the last five years.

That query scans millions (or billions) of historical records while performing aggregations and joins. A row-oriented transactional database is simply not designed for this workload.

This gap eventually led to the evolution of data warehouses, data lakes, and ultimately lakehouses.

---

# The Data Warehouse Era: Powerful, but Expensive

To solve analytical workloads, organizations adopted **data warehouses**.

Systems like **Teradata**, **Oracle Exadata**, and later **Amazon Redshift** were purpose-built for OLAP workloads. Instead of optimizing for tiny transactional operations, they were designed to scan millions of rows, perform aggregations efficiently, and power dashboards and reports.

However, early data warehouses had one defining architectural characteristic:

> **Storage and compute were tightly coupled.**

The same machines responsible for storing data were also responsible for processing analytical queries.

This introduced a scaling problem.

Need more compute?

You also had to buy more storage.

Need more storage for historical data?

You still had to pay for additional compute resources even if they remained idle.

As organizations generated more data, this architecture became increasingly expensive.

Another limitation was the kind of data warehouses were built for.

They excelled at handling **structured data** with predefined schemas. But modern systems generate far more than structured tables.

Organizations now produce:

- Application logs
- JSON events
- IoT sensor streams
- Images
- Semi-structured documents

Loading all of this into a rigid warehouse schema before even knowing how it would be analyzed became slow, expensive, and often unnecessary.

Eventually, the industry asked a different question:

> What if storage and compute were completely separated?

---

# The Data Lake Era: Cheap Storage, New Chaos

That idea gave birth to the **data lake**.

Instead of storing data inside proprietary warehouse storage, organizations began storing everything directly in inexpensive object storage such as **Amazon S3**.

Storage became independent from compute.

Companies now paid very little for storing data and only paid for compute when queries actually ran.

This fundamentally changed the economics of data platforms.

But it also introduced an entirely new problem.

Without structure or governance, a data lake quickly becomes a **data swamp**—a giant collection of files where nobody knows:

- Which dataset is authoritative?
- Which schema does this file follow?
- Which version is the latest?
- Which files belong to the same logical table?

To make data lakes queryable, the ecosystem needed something SQL-like.

This is where **Apache Hive** entered the picture.

Hive allowed analysts to write familiar SQL queries over files stored inside Hadoop and later cloud object storage.

It worked remarkably well for its time.

However, Hive's abstraction was relatively thin.

It tracked metadata primarily at the **directory and partition level**, not at the individual file level.

As datasets grew, several problems emerged:

- Updating or deleting a single record often required rewriting entire partitions.
- Schema evolution was difficult and occasionally broke existing queries.
- Concurrent writers could expose readers to inconsistent table states.
- There were no robust transactional guarantees across multiple writers.

Effectively, analysts were working with a folder full of files pretending to be a database table.

At small scale, this worked.

At enterprise scale, it became increasingly difficult to manage.

---

# Enter the Table Format: Iceberg as the Missing Abstraction

Apache Iceberg was built to solve precisely this problem.

Instead of treating a table as simply **a folder of files**, Iceberg introduces a dedicated **table format** that sits between compute engines and the underlying data files.

Its metadata layer tracks exactly:

- Which files belong to the table
- Which snapshot is current
- Which schema is active
- Which partitions exist
- Which files were added or removed

Unlike Hive, Iceberg tracks **individual data files**, not just partitions.

This enables capabilities that traditional data lakes struggled with:

- Safe schema evolution
- Atomic commits
- Time travel
- Reliable concurrent writes
- Snapshot isolation

In effect, Iceberg gives a data lake many of the guarantees traditionally associated with data warehouses while preserving its biggest advantage:

**cheap, open, decoupled object storage.**

That is the evolution of modern analytical systems.

- Data warehouses gave us performance, but tightly coupled storage and compute.
- Data lakes gave us inexpensive, flexible storage, but sacrificed reliability.
- Open table formats like Apache Iceberg combine the strengths of both worlds.

---

# Inside Apache Iceberg: The Architecture

To understand why Iceberg behaves differently from previous table formats, it helps to begin from the bottom and move upward through each metadata layer.

```
[iceberg-architecture]
```

Every layer has one responsibility.

---

## The Data Layer: Parquet and Row Groups

Iceberg stores actual data in formats such as **Apache Parquet** (along with ORC or Avro).

Parquet itself is not just a flat file.

Internally it divides data into **row groups**, where each row group contains a subset of rows while storing every column contiguously.

This provides two important advantages.

First, analytical queries often require only a few columns.

Instead of reading all fifty columns of a dataset, the engine reads only the required ones.

Second, every row group stores useful statistics inside the file footer:

- Minimum values
- Maximum values
- Null counts
- Row counts

These statistics enable **predicate pushdown**, allowing engines to skip reading unnecessary row groups.

However, Parquet statistics only become available **after opening a file**.

Iceberg extends this idea further.

---

## Manifest Files: The Ledger of Data Files

A **manifest file** records metadata about every data file belonging to a table.

For each file it stores:

- File location
- Partition values
- Row count
- Column statistics
- Min/max values
- Null counts

This allows query engines to eliminate entire data files before opening them.

For example, if a query asks for records after January 2025, files whose maximum date is December 2024 can be skipped immediately.

---

## Manifest List: The Summary of Manifests

Large tables may contain thousands of manifest files.

Iceberg therefore introduces another layer called the **manifest list**.

A manifest list keeps track of:

- Which manifest files belong to a snapshot
- Their locations
- Summary statistics
- Added or removed files

Every snapshot has exactly one manifest list.

---

## Metadata File: The Root of Truth

At the top sits the **metadata file**, stored as JSON.

It contains:

- Current schema
- Schema history
- Partition specification
- Snapshot history
- References to manifest lists

The important detail is that Iceberg never edits metadata in place.

Every successful commit creates a **new metadata file**.

Old metadata files remain untouched.

This simple design enables:

- Time travel
- Snapshot isolation
- Rollbacks
- Atomic commits

---

## The Catalog: Where "Current" Lives

Multiple metadata files may exist for the same table.

The **catalog** simply stores a pointer to the latest metadata file.

Common catalog implementations include:

- AWS Glue
- Hive Metastore
- Project Nessie
- REST Catalog

Updating this single pointer atomically is what makes every Iceberg commit atomic.

Readers either observe the previous snapshot or the new snapshot.

They never observe an incomplete write.

---

# Putting Everything Together

The architecture naturally forms two opposite flows.

## Read Path

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

A query progressively narrows down the files it needs to read.

By the time Parquet files are opened, most unnecessary files have already been eliminated.

---

## Write Path

```
New Parquet Files
        ↓
New Manifest Files
        ↓
New Manifest List
        ↓
New Metadata File
        ↓
Atomic Catalog Pointer Update
```

Nothing is ever modified in place.

A commit only becomes visible after the catalog pointer is atomically updated.

---

# Delete Files: Handling Change in an Immutable World

Object storage systems such as Amazon S3 are fundamentally immutable.

You cannot edit bytes inside an existing Parquet file.

You can only create new files or remove old ones.

So how does Iceberg support updates and deletes?

The answer is **delete files**.

Instead of rewriting a data file immediately, Iceberg records deleted rows inside a separate delete file.

The original Parquet file remains untouched.

During reads, Iceberg combines the original data file with its corresponding delete files and filters out logically deleted rows.

This introduces two different strategies.

## Copy-on-Write (CoW)

When rows change, Iceberg rewrites the affected data files entirely.

Advantages:

- Faster reads
- No delete files to reconcile

Disadvantages:

- More expensive writes
- Large files rewritten for small updates

---

## Merge-on-Read (MoR)

Instead of rewriting data files, Iceberg writes lightweight delete files.

Advantages:

- Very fast writes
- Minimal rewrite cost

Disadvantages:

- Reads become more expensive because delete files must be merged during query execution.

---

This tradeoff is exactly what eventually leads to **compaction**.

Over time, delete files and many small data files accumulate.

At some point, Iceberg rewrites them into larger, cleaner data files to restore query performance.

That compaction process—and the different optimization strategies around it—is what I'll cover in **Part 2**.



[iceberg-architecture] :/public/uuid=598F9AF6-2227-4B98-A51F-14604439BA30&code=001&library=1&type=1&mode=1&loc=true&cap=true.jpeg
