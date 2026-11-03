import { beforeEach, describe, expect, it } from "vitest"
import {
  addClient,
  archiveClientById,
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
})
