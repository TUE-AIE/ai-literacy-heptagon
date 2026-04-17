/**
 * Canonical TU/e LIS organisational hierarchy.
 * Source: screenshots supplied 2026-04-16. Items marked TRUNCATED must be
 * confirmed with the AI Literacy Team before release.
 */

export interface ProductArea {
  key: string;
  name: string;
  teams: readonly { name: string; truncated?: true }[];
}

export const PRODUCT_AREAS: readonly ProductArea[] = [
  {
    key: "education",
    name: "Education",
    teams: [
      { name: "Alliance Support" },
      { name: "Assessment Support" },
      { name: "Learning Support" },
      { name: "Hybrid Education and Audio Visual", truncated: true },
      { name: "Student and Education Logistics", truncated: true }
    ]
  },
  {
    key: "research",
    name: "Research",
    teams: [
      { name: "Data Stewards" },
      { name: "Research IT" },
      { name: "Research Data Literacy & Curation" },
      { name: "Research Data Platform" },
      { name: "Research Tooling" },
      { name: "Research Workflows" },
      { name: "Service Design & User Experience" },
      { name: "Supercomputing Center" }
    ]
  },
  {
    key: "libraryAndOpenScience",
    name: "Library and Open Science",
    teams: [
      { name: "Information Literacy and Education" },
      { name: "Library Front and Back Office" },
      { name: "Library Collection and Research Inf.", truncated: true },
      { name: "Open Science Support" }
    ]
  },
  {
    key: "corporate",
    name: "Corporate",
    teams: [
      { name: "Campus Safety and Security" },
      { name: "Communication and CRM" },
      { name: "Enterprise Service and Process Opt.", truncated: true },
      { name: "Facility Management Support" },
      { name: "Finance and Procurement" },
      { name: "Human Resources Management" }
    ]
  },
  {
    key: "dataAndInsights",
    name: "Data and Insights",
    teams: [
      { name: "Archive" },
      { name: "Business Intelligence and Analytics" },
      { name: "Data Domain Coordinators" },
      { name: "Data Management" },
      { name: "Privacy Operations" }
    ]
  },
  {
    key: "platforms",
    name: "Platforms",
    teams: [
      { name: "Collaboration and Productivity" },
      { name: "Compute and Storage Services" },
      { name: "Identity and Access Management" },
      { name: "Integration Services" },
      { name: "Network and Connectivity Services" },
      { name: "Security Operations" },
      { name: "Workplace Management" }
    ]
  },
  {
    key: "services",
    name: "Services",
    teams: [
      { name: "Departmental Support" },
      { name: "Service Operations" },
      { name: "Student and Employee Service Desk" },
      { name: "Workplace Devices" }
    ]
  },
  {
    key: "officeOfTheCio",
    name: "Office of the CIO",
    teams: [
      { name: "Agile Center of Excellence (ACE)" },
      { name: "Contract and Supplier management" },
      { name: "Communication" },
      { name: "Enterprise Architecture" },
      { name: "Governance, Risk and Compliance" }
    ]
  }
] as const;
