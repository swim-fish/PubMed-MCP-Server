# PubMed MCP Server Installation & Configuration

This guide details the steps to build, register, and configure the PubMed Model Context Protocol (MCP) server.

## 1. Build the Docker Image

Compile the Docker image for the local PubMed MCP server.

```bash
docker build -t local/pubmed-mcp-server:latest .
```

## 2. Register the MCP Catalog

Initialize the local catalog and register the PubMed server definition.

### Step 2.1: Create Local Catalog

Create a new namespace for local PubMed services.

```bash
docker mcp catalog create local-pubmed
```

### Step 2.2: Add Server to Catalog

Import the server configuration from your source YAML file (`pubmed-catalog.yaml`) into the local catalog.

```bash
docker mcp catalog add local-pubmed pubmed-mcp-server pubmed-catalog.yaml
```

### Expected Output

Successful execution of the above commands should yield output similar to:

```text
> docker mcp catalog create local-pubmed
created empty catalog local-pubmed

> docker mcp catalog add local-pubmed pubmed-mcp-server pubmed-catalog.yaml
copied server "pubmed-mcp-server" from catalog "pubmed-catalog.yaml" to "local-pubmed"
```

---

## 3. Client Configuration

To enable the server in your MCP client (e.g., Claude Desktop, IDEs), add the following entry to your MCP configuration file (typically `config.json`).

> **Note:** Ensure you replace `YOUR_API_KEY_HERE` and `YOUR_EMAIL_HERE` with your actual NCBI credentials. Providing an API key increases the rate limit to 10 requests/second.

```json
{
  "mcpServers": {
    "pubmed-mcp": {
      "transport": "stdio",
      "enabled": true,
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--env", "NCBI_API_KEY", 
        "--env", "NCBI_EMAIL",
        "local/pubmed-mcp-server:latest"
      ],
      "env": {
        "NCBI_API_KEY": "YOUR_API_KEY_HERE",
        "NCBI_EMAIL": "YOUR_EMAIL_HERE"
      },
      "url": null,
      "extraData": null,
      "proxy": null,
      "headers": null,
      "exclude_tools": []
    }
  }
}

```

---

## 4. Manual Configuration Reference

The following sections verify the internal file structures created by the catalog registration process. These files define the server capabilities and registry references.

### Catalog Definition

**File Path:** `.docker/mcp/catalogs/local-pubmed.yaml`

This file defines the server metadata, environment variables, and available tools.

```yaml
name: local-pubmed
displayName: local-pubmed
registry:
  pubmed-mcp-server:
    type: server
    image: local/pubmed-mcp-server:latest
    title: PubMed MCP Server
    description: Search, retrieve, and analyze biomedical literature from PubMed. Features advanced filtering, full-text retrieval (PMC), and citation network analysis.
    publisher: Augmented Nature
    env:
      - name: NCBI_API_KEY
        description: API Key for NCBI (Increases rate limit to 10 req/s)
        required: false
      - name: NCBI_EMAIL
        description: Email address for NCBI identification (Good practice)
        required: false
      - name: MCP_TRANSPORT_TYPE
        description: Transport mode (stdio or http)
        default: stdio
        required: false
    tools:
      - name: search_articles
        description: Basic search by keywords, authors, journals, or dates.
      - name: advanced_search
        description: Complex queries with boolean operators and field-specific filters.
      - name: search_by_author
        description: Find articles by specific author(s) with affiliation filtering.
      - name: search_by_journal
        description: Search within specific journals with date ranges.
      - name: search_by_mesh_terms
        description: Search using Medical Subject Headings (MeSH).
      - name: get_trending_articles
        description: Get recently published articles in a specific field.
      - name: get_article_details
        description: Get comprehensive metadata and abstract for a specific PMID.
      - name: get_abstract
        description: Retrieve just the article abstract by PMID.
      - name: get_full_text
        description: Retrieve full text from PubMed Central (PMC) when available.
      - name: batch_article_lookup
        description: Retrieve metadata for multiple PMIDs efficiently.
      - name: get_cited_by
        description: Find articles that cite a specific PMID.
      - name: get_references
        description: Get the reference list for an article.
      - name: get_similar_articles
        description: Find related articles based on content similarity.
      - name: export_citation
        description: Generate citations in APA, MLA, Chicago, BibTeX, or RIS formats.
      - name: validate_pmid
        description: Check if a PubMed ID is valid and exists.
      - name: convert_identifiers
        description: Convert between PMID, DOI, and PMC IDs.

```

### Registry Entry

**File Path:** `~/.docker/mcp/registries.yaml`

Ensure the local catalog is referenced in the global registry configuration.

```yaml
registry:
  pubmed-mcp-server:
    ref: ""

```
