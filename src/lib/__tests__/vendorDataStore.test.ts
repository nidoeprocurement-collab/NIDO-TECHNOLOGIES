import { beforeEach, describe, expect, it } from "vitest"
import {
  addVendor,
  archiveVendorById,
  deleteVendorById,
  getVendorById,
  getVendors,
  restoreArchivedVendor,
  updateVendor,
  type VendorRecord,
} from "../vendorDataStore"

function makeVendor(id: string, name: string, email = `${id.toLowerCase()}@example.com`): VendorRecord {
  return {
    id,
    name,
    category: "IT Hardware",
    primaryContact: "Contact Person",
    email,
    phone: "+91 9876543210",
    rating: 4.5,
    region: "Karnataka",
    status: "Active",
    onboardedDate: "10 Nov 2026",
    monthSpend: 0,
    score: 4.5,
    address: "Bangalore, Karnataka, India",
    totalSpend: 0,
    complianceIssues: 0,
    archived: false,
  }
}

describe("vendorDataStore live operations and mock purge", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("starts with an empty vendor list without mock demo vendors", () => {
    expect(getVendors()).toEqual([])
  })

  it("purges legacy seeded mock demo vendors while preserving real onboarded vendors", () => {
    const legacyAndReal = [
      makeVendor("VND-1001", "InfoTech Pvt. Ltd.", "amit.s@infotech.in"),
      makeVendor("VND-1002", "Logistics Express", "priya.n@logexpress.com"),
      makeVendor("VND-1003", "GreenLeaf Supplies", "rohit.v@greenleaf.org"),
      makeVendor("VND-1004", "Cloud Systems India", "sneha.p@cloudsys.in"),
      makeVendor("VND-1005", "FastTrack Movers", "vikram.r@fasttrack.co"),
      makeVendor("VND-1001", "Real User Vendor Pvt Ltd", "contact@realvendor.in"),
      makeVendor("VND-1006", "Apex Enterprise Solutions", "sales@apex.in"),
    ]
    localStorage.setItem("nido_vendors_v2", JSON.stringify(legacyAndReal))

    const loaded = getVendors()
    expect(loaded).toHaveLength(2)
    expect(loaded.map((v) => v.name)).toEqual([
      "Real User Vendor Pvt Ltd",
      "Apex Enterprise Solutions",
    ])
  })

  it("supports live onboarding, updating, archiving, restoring, and permanent deletion", () => {
    addVendor(makeVendor("VND-1001", "Nova Tech Supplies"))
    expect(getVendors()).toHaveLength(1)
    expect(getVendorById("vnd-1001")?.name).toBe("Nova Tech Supplies")

    updateVendor("VND-1001", { status: "On Hold", city: "Mumbai" })
    expect(getVendorById("VND-1001")?.status).toBe("On Hold")
    expect(getVendorById("VND-1001")?.city).toBe("Mumbai")

    expect(archiveVendorById("VND-1001")).toMatchObject({ id: "VND-1001", archived: true })
    expect(getVendorById("VND-1001")?.archived).toBe(true)

    expect(restoreArchivedVendor("VND-1001")).toMatchObject({ id: "VND-1001", archived: false })
    expect(getVendorById("VND-1001")?.archived).toBe(false)

    expect(deleteVendorById("VND-1001")).toBe(true)
    expect(getVendors()).toEqual([])
  })
})

