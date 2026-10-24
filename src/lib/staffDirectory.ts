import type { StaffMember } from "./types";

/**
 * Port for the bank staff directory that powers the searchable dropdown on the
 * create-user form. The real endpoint does not exist yet, so the app resolves the port
 * through `getStaffDirectory()`:
 *
 *  - set `VITE_STAFF_DIRECTORY_URL` (e.g. `https://hr/api/staff/search`) and the HTTP
 *    adapter takes over, no other code changes;
 *  - leave it unset and the bundled mock directory answers instead.
 *
 * Expected HTTP contract (both directions JSON):
 *
 *   GET {VITE_STAFF_DIRECTORY_URL}?query=jane
 *   -> [{ id, staffId, firstName, lastName, email, department, title }, ...]
 *
 * If your real endpoint wraps the array, adjust only `HttpDirectory.search` below.
 */
export interface StaffDirectory {
  search(query: string, signal?: AbortSignal): Promise<StaffMember[]>;
}

/* ------------------------------------------------------------------ *
 * Mock directory - stands in until HR/AD exposes the real endpoint.
 * ------------------------------------------------------------------ */

const MOCK_STAFF: StaffMember[] = [
  { id: "s-001", staffId: "SB-1042", firstName: "Amara", lastName: "Okonkwo", email: "amara.okonkwo@skybank.sl", department: "Digital Banking", title: "Head of Digital Channels" },
  { id: "s-002", staffId: "SB-1087", firstName: "Ibrahim", lastName: "Kamara", email: "ibrahim.kamara@skybank.sl", department: "Trade Services", title: "Trade Finance Manager" },
  { id: "s-003", staffId: "SB-1103", firstName: "Fatmata", lastName: "Bangura", email: "fatmata.bangura@skybank.sl", department: "Internal Audit", title: "Senior Audit Officer" },
  { id: "s-004", staffId: "SB-1119", firstName: "Chidi", lastName: "Nwosu", email: "chidi.nwosu@skybank.sl", department: "Corporate Banking", title: "Relationship Director" },
  { id: "s-005", staffId: "SB-1156", firstName: "Kadiatu", lastName: "Sesay", email: "kadiatu.sesay@skybank.sl", department: "Operations", title: "Settlement Officer" },
  { id: "s-006", staffId: "SB-1178", firstName: "Emeka", lastName: "Obi", email: "emeka.obi@skybank.sl", department: "Risk Management", title: "Credit Risk Analyst" },
  { id: "s-007", staffId: "SB-1204", firstName: "Adaeze", lastName: "Eze", email: "adaeze.eze@skybank.sl", department: "Treasury", title: "Treasury Dealer" },
  { id: "s-008", staffId: "SB-1231", firstName: "Mohamed", lastName: "Sankoh", email: "mohamed.sankoh@skybank.sl", department: "IT Services", title: "Infrastructure Engineer" },
  { id: "s-009", staffId: "SB-1247", firstName: "Ngozi", lastName: "Adeyemi", email: "ngozi.adeyemi@skybank.sl", department: "Compliance", title: "AML Officer" },
  { id: "s-010", staffId: "SB-1263", firstName: "Sorie", lastName: "Koroma", email: "sorie.koroma@skybank.sl", department: "Branch Network", title: "Branch Manager, Freetown Central" },
  { id: "s-011", staffId: "SB-1290", firstName: "Chiamaka", lastName: "Okoro", email: "chiamaka.okoro@skybank.sl", department: "Digital Banking", title: "Product Manager, Payments" },
  { id: "s-012", staffId: "SB-1312", firstName: "Alusine", lastName: "Turay", email: "alusine.turay@skybank.sl", department: "Operations", title: "Clearing Officer" },
  { id: "s-013", staffId: "SB-1334", firstName: "Zainab", lastName: "Sesay", email: "zainab.sesay@skybank.sl", department: "Customer Experience", title: "Service Quality Lead" },
  { id: "s-014", staffId: "SB-1351", firstName: "Oluwaseun", lastName: "Adebayo", email: "oluwaseun.adebayo@skybank.sl", department: "IT Services", title: "Application Support Analyst" },
  { id: "s-015", staffId: "SB-1377", firstName: "Hawa", lastName: "Conteh", email: "hawa.conteh@skybank.sl", department: "Human Resources", title: "HR Business Partner" },
  { id: "s-016", staffId: "SB-1392", firstName: "Tunde", lastName: "Bakare", email: "tunde.bakare@skybank.sl", department: "Corporate Banking", title: "Coverage Banker" },
  { id: "s-017", staffId: "SB-1410", firstName: "Isata", lastName: "Kallo", email: "isata.kallo@skybank.sl", department: "Finance", title: "Management Accountant" },
  { id: "s-018", staffId: "SB-1438", firstName: "Chinedu", lastName: "Uche", email: "chinedu.uche@skybank.sl", department: "Risk Management", title: "Operational Risk Manager" },
  { id: "s-019", staffId: "SB-1455", firstName: "Yusuf", lastName: "Dumbuya", email: "yusuf.dumbuya@skybank.sl", department: "Trade Services", title: "Documentary Credits Officer" },
  { id: "s-020", staffId: "SB-1471", firstName: "Nneka", lastName: "Chukwu", email: "nneka.chukwu@skybank.sl", department: "Compliance", title: "Compliance Analyst" },
  { id: "s-021", staffId: "SB-1498", firstName: "Abdul", lastName: "Rahman", email: "abdul.rahman@skybank.sl", department: "Treasury", title: "Money Market Dealer" },
  { id: "s-022", staffId: "SB-1513", firstName: "Blessing", lastName: "Akpabio", email: "blessing.akpabio@skybank.sl", department: "Internal Audit", title: "IT Auditor" },
  { id: "s-023", staffId: "SB-1537", firstName: "Lamin", lastName: "Jalloh", email: "lamin.jalloh@skybank.sl", department: "Branch Network", title: "Branch Manager, Bo Road" },
  { id: "s-024", staffId: "SB-1554", firstName: "Ify", lastName: "Nnadi", email: "ify.nnadi@skybank.sl", department: "Digital Banking", title: "UX Designer" },
  { id: "s-025", staffId: "SB-1579", firstName: "Peter", lastName: "Mansaray", email: "peter.mansaray@skybank.sl", department: "Operations", title: "Vault Custodian" },
  { id: "s-026", staffId: "SB-1596", firstName: "Aisha", lastName: "Bello", email: "aisha.bello@skybank.sl", department: "Customer Experience", title: "Contact Centre Lead" },
  { id: "s-027", staffId: "SB-1614", firstName: "Kelechi", lastName: "Okafor", email: "kelechi.okafor@skybank.sl", department: "Corporate Banking", title: "Credit Officer" },
  { id: "s-028", staffId: "SB-1639", firstName: "Mariama", lastName: "Kamara", email: "mariama.kamara@skybank.sl", department: "Human Resources", title: "Talent Acquisition Specialist" },
  { id: "s-029", staffId: "SB-1652", firstName: "Bola", lastName: "Ahmed", email: "bola.ahmed@skybank.sl", department: "Finance", title: "Treasury Back Office" },
  { id: "s-030", staffId: "SB-1678", firstName: "Samuel", lastName: "Sowa", email: "samuel.sowa@skybank.sl", department: "IT Services", title: "Security Engineer" },
  { id: "s-031", staffId: "SB-1695", firstName: "Chinelo", lastName: "Egwu", email: "chinelo.egwu@skybank.sl", department: "Risk Management", title: "Model Validation Analyst" },
  { id: "s-032", staffId: "SB-1712", firstName: "Sulaiman", lastName: "Beri", email: "sulaiman.beri@skybank.sl", department: "Branch Network", title: "Relationship Officer" },
  { id: "s-033", staffId: "SB-1736", firstName: "Grace", lastName: "Mbeki", email: "grace.mbeki@skybank.sl", department: "Compliance", title: "Sanctions Screening Officer" },
  { id: "s-034", staffId: "SB-1751", firstName: "David", lastName: "Kpukumu", email: "david.kpukumu@skybank.sl", department: "Operations", title: "Merchant Acquiring Officer" },
  { id: "s-035", staffId: "SB-1778", firstName: "Halima", lastName: "Wurie", email: "halima.wurie@skybank.sl", department: "Customer Experience", title: "VIP Banking Officer" },
  { id: "s-036", staffId: "SB-1793", firstName: "Uche", lastName: "Mmadu", email: "uche.mmadu@skybank.sl", department: "Digital Banking", title: "API Product Owner" },
];

const MAX_RESULTS = 8;

/** In-memory directory: case-insensitive match on name, email, department or staff id. */
export class MockStaffDirectory implements StaffDirectory {
  search(query: string, signal?: AbortSignal): Promise<StaffMember[]> {
    const normalized = query.trim().toLowerCase();

    return new Promise((resolve, reject) => {
      // A short delay keeps the dropdown's loading state honest when the real
      // endpoint eventually replaces this class.
      const timer = window.setTimeout(() => {
        if (signal?.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        if (!normalized) {
          resolve(MOCK_STAFF.slice(0, MAX_RESULTS));
          return;
        }
        resolve(
          MOCK_STAFF.filter((member) =>
            [
              `${member.firstName} ${member.lastName}`,
              member.email,
              member.department,
              member.staffId,
              member.title,
            ]
              .join(" ")
              .toLowerCase()
              .includes(normalized),
          ).slice(0, MAX_RESULTS),
        );
      }, 220);

      signal?.addEventListener("abort", () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }
}

/** Talks to the real directory endpoint: `GET {baseUrl}?query=...`. */
export class HttpStaffDirectory implements StaffDirectory {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async search(query: string, signal?: AbortSignal): Promise<StaffMember[]> {
    const url = `${this.baseUrl}${this.baseUrl.includes("?") ? "&" : "?"}query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (!response.ok) {
      throw new Error(`Staff directory request failed (${response.status})`);
    }
    const body: unknown = await response.json();
    return Array.isArray(body) ? (body as StaffMember[]) : [];
  }
}

let directory: StaffDirectory | null = null;

/** Resolves the configured directory once - mock until `VITE_STAFF_DIRECTORY_URL` is set. */
export function getStaffDirectory(): StaffDirectory {
  if (!directory) {
    const url = import.meta.env.VITE_STAFF_DIRECTORY_URL as string | undefined;
    directory = url ? new HttpStaffDirectory(url) : new MockStaffDirectory();
  }
  return directory;
}
