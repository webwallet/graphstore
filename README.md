# WebWallet Graphstore
Transaction clearing microservice for the WebWallet API.

## Contents
- Graph Database
- Data Modeling
- Query Design

## Graph Database
### Neo4j
  - **Cypher**

## Data Modeling

### Nodes
Labels: `IOU`, `Address`, `Currency`, `Transaction`, `Outputs`.

  - **IOU**
  - **Address**
  - **Currency**
  - **Transaction**  
A transaction is a document, not an operation. Inserting a `Transaction` node is not equivalent to executing a transaction, which involves creating other nodes and relationships as well.
    - **Outputs**

### Relationships
Types: `Funds`, `Spends`, `Points`.

  - **Clearing**
    - **IOUs**
    - **Outputs**
  - **Indexing**
    - **Outputs**

### Constraints
  Nodes with `Address` labels must satisfy the `id` property uniqueness constraint. Since `Transaction` nodes will be retrieved through traversals starting at `Address` nodes using their `Outputs` node (manual index), no constraint is imposed on `Transaction` node IDs in order to prevent a potentially large index from being created automatically by the database.
  ```
  CREATE CONSTRAINT ON (address:Address) ASSERT address.id IS UNIQUE
  ```
  Since uniqueness contraints cannot be created on relationships, `CREATE UNIQUE` must be used in combination with previous checks in order to manually enforce unique relationships on nodes.
  ```
  ...
  WHERE NOT (txo)<-[:Spends {id:0}]-()
  CREATE UNIQUE (txo)<-[s:Spends {id: 0}]-(txn)
  ...
  ```
  Relationships with `Spends` labels should satisfy the `id` property existence constraint [enterprise edition feature]. Since `Transaction` documents contain outputs that can be referenced by subsequent transactions for clearing purposes, every `Transaction` that `Spends` another `Transaction` must specify which output it is referencing/spending.
  ```
  CREATE CONSTRAINT ON ()-[output:Spends]-() ASSERT exists(output.id)
  ```

## Query Design

### Clearing
  - **Output Spending**
  ```
  MATCH (txo:Transaction)
  WHERE txo.id = {transactionId}
  SET txo.lock = true
  WITH txo
  WHERE NOT (txo)<-[:Spends {id:{outputId}}]-()
  CREATE UNIQUE (txo)<-[:Spends {id: {outputId}}]-(txn:Transaction)
  REMOVE txo.lock
  RETURN txo, txn
  ```
