import axios from "axios";

const API_BASE = "https://api.data.world/v0";
const QUERY_BASE = "https://query.data.world";

export class DataWorldClient {
  constructor() {
    this.token = process.env.DW_AUTH_TOKEN;
    if (!this.token) {
      console.error(
        "Warning: DW_AUTH_TOKEN not set. Some endpoints may fail."
      );
    }
    this.http = axios.create({
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : undefined,
      },
    });
  }

  async searchDatasets(query, limit = 10) {
    // POST /v0/search with JSON body {"query": "..."}
    const resp = await this.http.post(
      `${API_BASE}/search`,
      { query },
      { headers: { "Content-Type": "application/json" } }
    );
    const records = resp.data.records || [];
    if (!Array.isArray(records)) return [];
    return records.slice(0, Math.min(limit, 50)).map((d) => ({
      id: d.id,
      title: d.title || d.name,
      owner: d.owner,
      description: d.description || "",
      url: d.resourceLink || `https://data.world/${d.owner}/${d.id}`,
      tags: d.tags || [],
      updated: d.updated || d.updatedAt,
    }));
  }

  async getDataset(owner, dataset) {
    const resp = await this.http.get(
      `${API_BASE}/datasets/${owner}/${dataset}`
    );
    const d = resp.data;
    return {
      id: d.id,
      title: d.title || d.name,
      owner: d.owner,
      description: d.description || "",
      summary: d.summary || "",
      tags: d.tags || [],
      license: d.license,
      visibility: d.visibility,
      files: (d.files || []).map((f) => ({
        name: f.name,
        size: f.sizeInBytes,
        created: f.created,
        updated: f.updated,
      })),
      url: `https://data.world/${owner}/${dataset}`,
      created: d.created,
      updated: d.updated,
    };
  }

  async listFiles(owner, dataset) {
    const ds = await this.getDataset(owner, dataset);
    return ds.files;
  }

  async querySql(owner, dataset, query) {
    // query.data.world returns SPARQL-style JSON: {head, results: {bindings}}
    const resp = await this.http.get(
      `${QUERY_BASE}/sql/${owner}/${dataset}`,
      {
        params: { query },
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
        },
      }
    );
    const data = resp.data;
    // Normalize SPARQL bindings into flat row objects
    if (data.results && Array.isArray(data.results.bindings)) {
      return data.results.bindings.map((row) => {
        const flat = {};
        for (const [key, val] of Object.entries(row)) {
          flat[key] = val.value !== undefined ? val.value : val;
        }
        return flat;
      });
    }
    // If already flat array, return as-is
    if (Array.isArray(data)) return data;
    return data;
  }

  async downloadFile(owner, dataset, file, maxRows = 500) {
    const resp = await this.http.get(
      `${API_BASE}/file_download/${owner}/${dataset}/${encodeURIComponent(file)}`,
      { responseType: "text" }
    );
    const content = resp.data;
    if (typeof content === "string" && content.includes("\n")) {
      const lines = content.split("\n");
      if (lines.length > maxRows + 1) {
        const truncated = lines.slice(0, maxRows + 1).join("\n");
        return {
          content: truncated,
          truncated: true,
          totalRows: lines.length - 1,
          returnedRows: maxRows,
        };
      }
    }
    return {
      content: typeof content === "string" ? content : JSON.stringify(content),
      truncated: false,
    };
  }

  async listUserDatasets(owner, limit = 20) {
    const resp = await this.http.get(`${API_BASE}/datasets/${owner}`, {
      params: { limit },
    });
    const records = resp.data.records || resp.data;
    if (!Array.isArray(records)) return [];
    return records.map((d) => ({
      id: d.id,
      title: d.title || d.name,
      owner: d.owner || owner,
      description: d.description || "",
      url: `https://data.world/${d.owner || owner}/${d.id}`,
      updated: d.updated || d.updatedAt,
    }));
  }
}
