# Cross-Border Data Transfer Policy

**Document ID:** CBDT-2025-08  
**Version:** 2.1  
**Last Updated:** August 16, 2025  
**Effective Date:** September 1, 2025  
**Supersedes:** Cross-Border Data Transfer Policy v2.0 (May 20, 2025)

## 1. Purpose and Scope

### 1.1 Purpose

This policy establishes the requirements and procedures for transferring personal data and other regulated data across national borders in compliance with applicable data protection laws and regulations. It is designed to ensure that all cross-border data transfers maintain appropriate safeguards to protect the privacy and security of data subjects' information.

### 1.2 Scope

This policy applies to:

- All personal data and regulated financial data processed by the Hedge Fund Trading Platform
- All cross-border transfers of such data between our global infrastructure regions
- All employees, contractors, and third parties who process data on our behalf
- All systems, applications, and services that process or store personal data

## 2. Regulatory Framework

### 2.1 Key Regulations

This policy is designed to comply with the following key regulations:

| Region | Regulation | Key Requirements |
|--------|------------|------------------|
| European Union | General Data Protection Regulation (GDPR) | Adequate safeguards for data transfers outside the EEA |
| United Kingdom | UK GDPR | Adequate safeguards for data transfers outside the UK |
| Singapore | Personal Data Protection Act (PDPA) | Comparable standard of protection for overseas transfers |
| Hong Kong | Personal Data (Privacy) Ordinance | Due diligence and contractual safeguards for transfers |
| United States | SEC/FINRA Regulations | Record keeping and data security requirements |
| Global | ISO 27001/27018 | Information security and PII protection in cloud services |

### 2.2 Transfer Mechanisms

The following transfer mechanisms are approved for cross-border data transfers:

| From | To | Approved Mechanism |
|------|-----|-------------------|
| EU/UK | US | EU-US Data Privacy Framework (DPF) |
| EU/UK | Singapore | Standard Contractual Clauses (SCCs) with supplementary measures |
| EU/UK | Hong Kong | Standard Contractual Clauses (SCCs) with supplementary measures |
| Singapore | EU/UK/US | Consent and contractual provisions |
| Hong Kong | EU/UK/US | Due diligence and contractual provisions |
| US | EU/UK/Singapore/Hong Kong | Contractual provisions aligned with destination requirements |

## 3. Data Classification and Transfer Requirements

### 3.1 Data Classification

Data is classified according to the following categories, with specific transfer requirements for each:

| Classification | Description | Examples | Transfer Requirements |
|----------------|-------------|----------|----------------------|
| Level 1 (High Sensitivity) | Personal data that could cause significant harm if compromised | Government IDs, financial account details, biometric data | - Data Protection Impact Assessment<br>- Executive approval<br>- End-to-end encryption<br>- Data residency verification<br>- Explicit consent (where applicable) |
| Level 2 (Medium Sensitivity) | Personal data that could cause moderate harm if compromised | Names, email addresses, employment information, trading history | - Transfer impact assessment<br>- Department head approval<br>- Encryption in transit<br>- Appropriate transfer mechanism |
| Level 3 (Low Sensitivity) | Non-personal data or anonymized data | Aggregated statistics, market data, anonymized usage patterns | - Standard security controls<br>- Encryption in transit |

### 3.2 Regional Data Storage Requirements

| Data Category | US East | EU West | Asia Pacific |
|---------------|---------|---------|--------------|
| US Customer PII | Primary storage | Not permitted unless explicit consent obtained | Not permitted unless explicit consent obtained |
| EU Customer PII | Not permitted unless using EU-US DPF | Primary storage | Not permitted unless using SCCs with supplementary measures |
| APAC Customer PII | Not permitted unless explicit consent obtained | Not permitted unless using SCCs | Primary storage |
| Financial Transaction Data | Replicated (full) | Replicated (full) | Replicated (full) |
| Market Data | Replicated (full) | Replicated (full) | Replicated (full) |
| Aggregated Analytics | Replicated (full) | Replicated (full) | Replicated (full) |

## 4. Cross-Border Transfer Procedures

### 4.1 Transfer Impact Assessment

Before transferring personal data across borders, a Transfer Impact Assessment (TIA) must be completed to:

1. Identify the categories of data being transferred
2. Document the purpose and necessity of the transfer
3. Identify the source and destination countries
4. Determine the appropriate transfer mechanism
5. Assess risks and implement appropriate safeguards
6. Document the assessment and approval

The TIA template is available in Appendix A of this policy.

### 4.2 EU-US Data Privacy Framework Transfers

For transfers from the EU/UK to the US under the EU-US Data Privacy Framework (DPF):

1. Verify that the transfer is covered by our DPF certification
2. Ensure the data categories are included in our DPF commitments
3. Document the transfer in the DPF transfer register
4. Implement the required technical and organizational measures
5. Provide appropriate notice to data subjects

### 4.3 Standard Contractual Clauses

For transfers using Standard Contractual Clauses (SCCs):

1. Use the appropriate set of SCCs based on the transfer scenario
2. Complete the appendices with accurate information
3. Conduct and document a transfer impact assessment
4. Implement any necessary supplementary measures
5. Obtain signatures from all relevant parties
6. Maintain a copy of the signed SCCs in the contract repository

### 4.4 Consent-Based Transfers

For transfers based on explicit consent:

1. Ensure consent is freely given, specific, informed, and unambiguous
2. Document the consent collection process and records
3. Provide clear information about the transfer, including:
   - Identity of data recipients
   - Country of destination
   - Purpose of transfer
   - Categories of data
   - Right to withdraw consent
4. Implement a process for handling consent withdrawal
5. Maintain consent records for the duration of processing

## 5. Technical and Organizational Measures

### 5.1 Technical Measures

The following technical measures must be implemented for all cross-border data transfers:

1. **Encryption**:
   - All data in transit must be encrypted using TLS 1.3 or higher
   - Level 1 data must be encrypted at rest using AES-256 or equivalent
   - Encryption keys must be managed according to the Key Management Policy

2. **Access Controls**:
   - Implement least privilege access to transferred data
   - Use multi-factor authentication for accessing sensitive data
   - Maintain access logs for all data access events

3. **Data Minimization**:
   - Transfer only the minimum data necessary for the purpose
   - Use data masking or pseudonymization where appropriate
   - Implement automated data minimization controls

4. **Monitoring and Logging**:
   - Log all cross-border data transfers
   - Monitor for unauthorized access or transfer attempts
   - Implement automated alerts for suspicious activities

### 5.2 Organizational Measures

The following organizational measures must be implemented:

1. **Documentation**:
   - Maintain records of all cross-border data transfers
   - Document the legal basis for each transfer
   - Maintain copies of all transfer mechanism documentation

2. **Training**:
   - Provide regular training on data protection requirements
   - Ensure staff understand cross-border transfer restrictions
   - Verify competency through assessments

3. **Vendor Management**:
   - Conduct due diligence on all data recipients
   - Include appropriate data protection clauses in contracts
   - Regularly audit vendor compliance

4. **Incident Response**:
   - Maintain procedures for handling data breaches
   - Establish notification procedures for cross-border incidents
   - Conduct regular incident response drills

## 6. Implementation in Multi-Region Architecture

### 6.1 Data Residency Controls

The following controls are implemented in our multi-region architecture:

1. **Data Classification Tagging**:
   - All data is tagged with classification level
   - PII data is tagged with country of origin
   - Automated controls enforce data residency requirements

2. **Regional Access Controls**:
   - Access to regional data stores is restricted based on data classification
   - Cross-region access requires additional authentication
   - All cross-region access is logged and monitored

3. **Data Transfer Gateway**:
   - All cross-region data transfers pass through a secure gateway
   - Gateway enforces transfer policies based on data classification
   - Transfers are logged and available for audit

4. **Automated Compliance Checks**:
   - Automated scanning detects potential compliance violations
   - Regular compliance audits verify proper data storage
   - Remediation workflows address any identified issues

### 6.2 Region-Specific Implementations

| Region | Specific Controls |
|--------|-------------------|
| US East | - SEC/FINRA compliance monitoring<br>- DPF compliance verification<br>- US person data identification |
| EU West | - GDPR Article 30 records maintenance<br>- Data subject rights automation<br>- SCCs management system |
| Asia Pacific | - PDPA consent management<br>- Regional regulatory notifications<br>- Country-specific controls for multiple jurisdictions |

## 7. Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| Data Protection Officer | - Overall policy ownership<br>- Approval of high-risk transfers<br>- Regulatory liaison<br>- Policy updates |
| Chief Information Security Officer | - Technical safeguards implementation<br>- Security control verification<br>- Incident response for security breaches |
| Legal Team | - Transfer mechanism documentation<br>- Contract review and approval<br>- Regulatory updates monitoring |
| Compliance Team | - Transfer impact assessments<br>- Compliance monitoring<br>- Audit support<br>- Training development |
| IT Operations | - Technical implementation<br>- Monitoring and logging<br>- Technical incident response |
| Data Owners | - Data classification verification<br>- Transfer necessity determination<br>- Business purpose documentation |
| All Employees | - Policy adherence<br>- Reporting potential violations<br>- Completing required training |

## 8. Compliance Monitoring and Enforcement

### 8.1 Monitoring Activities

The following monitoring activities will be conducted:

1. **Regular Audits**:
   - Quarterly review of cross-border transfers
   - Annual comprehensive data flow mapping
   - Regular testing of technical controls

2. **Automated Monitoring**:
   - Real-time monitoring of data transfers
   - Automated alerts for policy violations
   - Regular compliance reports

3. **Documentation Review**:
   - Quarterly review of transfer impact assessments
   - Annual review of transfer mechanisms
   - Regular validation of consent records

### 8.2 Enforcement

Policy violations will be addressed as follows:

1. **Investigation**:
   - All reported or detected violations will be investigated
   - Root cause analysis will be conducted
   - Impact assessment will be performed

2. **Remediation**:
   - Immediate actions to address violations
   - Long-term corrective measures
   - Process improvements to prevent recurrence

3. **Consequences**:
   - Violations may result in disciplinary action
   - Serious violations may result in termination
   - Intentional violations may be reported to authorities

## 9. Policy Exceptions

### 9.1 Exception Process

Exceptions to this policy may be granted under the following circumstances:

1. **Business Critical Need**:
   - Documented business necessity
   - No viable alternative available
   - Limited duration

2. **Legal Requirement**:
   - Court order or legal obligation
   - Regulatory requirement
   - Law enforcement request

### 9.2 Exception Approval

Exceptions require the following approvals:

1. Department Head
2. Data Protection Officer
3. Chief Information Security Officer
4. Legal Counsel

### 9.3 Exception Documentation

All exceptions must be documented with:

1. Justification for the exception
2. Risk assessment
3. Compensating controls
4. Expiration date
5. Approval signatures

## 10. Policy Review and Updates

This policy will be reviewed and updated:

- Annually as part of the regular policy review cycle
- When significant regulatory changes occur
- Following major organizational or system changes
- After significant incidents related to cross-border transfers

## Appendix A: Transfer Impact Assessment Template

[Transfer Impact Assessment Template available in the document repository]

## Appendix B: Approved Transfer Mechanisms

[Detailed documentation of approved transfer mechanisms available in the document repository]

## Appendix C: Regional Regulatory Requirements

[Summary of key regulatory requirements by region available in the document repository]

## Document History

| Version | Date | Author | Approved By | Changes |
|---------|------|--------|-------------|---------|
| 1.0 | 2024-01-15 | J. Smith | Legal & Compliance Committee | Initial version |
| 2.0 | 2025-05-20 | M. Johnson | Legal & Compliance Committee | Updated for multi-region deployment |
| 2.1 | 2025-08-16 | D. Thompson | Legal & Compliance Committee | Updated to reflect new EU-US Data Privacy Framework |

## Approval

This policy has been reviewed and approved by:

- Chief Compliance Officer
- Data Protection Officer
- Chief Information Security Officer
- Chief Technology Officer
- General Counsel