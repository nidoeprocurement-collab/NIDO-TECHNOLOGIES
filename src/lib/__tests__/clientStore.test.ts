import { beforeEach, describe, expect, it } from "vitest"
import {
  addClient,
  archiveClientById,
  evaluateClientBulkImport,
  getArchivedClients,
  getClients,
  isSharedClient,
  restoreArchivedClient,
  type StoredClient,
} from "../clientStore"

function loginAs(id: string, email: string) {
  localStorage.setItem(
    "nido_auth_user",
    JSON.stringify({
      id,
      email,
      name: id,
      role: "Administrator",
      userType: "nido_admin",
    }),
  )
}

function makeClient(id: string, name: string): StoredClient {
  return {
    id,
    name,
    company_name: name,
    category: "IT & Software",
    tier: "Standard Clients",
    rep: "Account Owner",
    email: `${id.toLowerCase()}@example.com`,
    phone: "9876543210",
    billingCity: "Bengaluru",
    status: "active",
  }
}

describe("clientStore account scoping and live operations", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("starts with an empty client list without mock demo clients", () => {
    loginAs("admin-a", "admin.a@nidotechnologies.com")
    expect(getClients()).toEqual([])
    expect(isSharedClient("CI-00019")).toBe(false)
  })

  it("keeps newly created clients isolated to the signed-in account", () => {
    loginAs("admin-a", "admin.a@nidotechnologies.com")
    addClient(makeClient("CL-90001", "Account A Private Client"))

    expect(getClients().some((client) => client.id === "CL-90001")).toBe(true)

    loginAs("admin-b", "admin.b@nidotechnologies.com")

    expect(getClients().some((client) => client.id === "CL-90001")).toBe(false)
  })

  it("allows editing any saved client in the signed-in account", () => {
    loginAs("admin-a", "admin.a@nidotechnologies.com")
    addClient(makeClient("CL-00001", "Acme Industries"))
    addClient({
      ...makeClient("CL-00001", "Acme Industries Updated"),
      billingCity: "Mumbai",
    })

    const saved = getClients().find((c) => c.id === "CL-00001")
    expect(saved?.name).toBe("Acme Industries Updated")
    expect(saved?.billingCity).toBe("Mumbai")
  })

  it("archives and restores a live client", () => {
    loginAs("admin-a", "admin.a@nidotechnologies.com")
    addClient(makeClient("CL-00002", "Zenith Corp"))

    expect(archiveClientById("CL-00002")).toBe(true)
    expect(getClients().some((c) => c.id === "CL-00002")).toBe(false)
    expect(getArchivedClients().some((c) => c.id === "CL-00002")).toBe(true)

    expect(restoreArchivedClient("CL-00002")).toBe(true)
    expect(getClients().some((c) => c.id === "CL-00002")).toBe(true)
    expect(getArchivedClients().some((c) => c.id === "CL-00002")).toBe(false)
  })

  it("skips rows with duplicate Client ID or Client Name during bulk import and returns imported/skipped lists", () => {
    const existing = [
      makeClient("CL-00001", "Infosys Limited"),
      makeClient("CL-00002", "Tata Consultancy Services"),
    ]

    const rows = [
      { "Client ID": "CL-00001", "Company Name": "Wipro Limited" },
      { "Client ID": "CL-00005", "Company Name": "Infosys Limited" },
      { "Client ID": "CL-00002", "Company Name": "Tata Consultancy Services" },
      { "Client ID": "CL-00003", "Company Name": "HCL Technologies" },
      { "Client ID": "", "Company Name": "Tech Mahindra" },
    ]

    const result = evaluateClientBulkImport(rows, existing, "CL-")

    expect(result.imported.map((c) => ({ id: c.id, name: c.name }))).toEqual([
      { id: "CL-00003", name: "HCL Technologies" },
      { id: "CL-00004", name: "Tech Mahindra" },
    ])

    expect(result.skipped).toEqual([
      {
        id: "CL-00001",
        name: "Wipro Limited",
        reason: "Client ID already exists",
      },
      {
        id: "CL-00005",
        name: "Infosys Limited",
        reason: "Client Name already exists",
      },
      {
        id: "CL-00002",
        name: "Tata Consultancy Services",
        reason: "Client ID and Client Name already exist",
      },
    ])
  })
})
