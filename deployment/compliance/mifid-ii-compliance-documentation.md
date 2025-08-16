# MiFID II Compliance Framework

**Document ID:** MiFID-2025-08  
**Version:** 3.0  
**Last Updated:** August 16, 2025  
**Effective Date:** September 1, 2025  
**Supersedes:** MiFID II Compliance Framework v2.5 (April 15, 2025)

## 1. Introduction

### 1.1 Purpose

This document outlines the compliance framework for the Hedge Fund Trading Platform to meet the requirements of the Markets in Financial Instruments Directive II (MiFID II) and the Markets in Financial Instruments Regulation (MiFIR). It incorporates the latest regulatory guidance from the European Securities and Markets Authority (ESMA) issued on July 12, 2025.

### 1.2 Scope

This framework applies to all operations of the Hedge Fund Trading Platform within the European Economic Area (EEA), particularly those managed through our EU West (Ireland) regional deployment. It covers all financial instruments within the scope of MiFID II/MiFIR and all services provided to clients located in the EEA.

### 1.3 Recent Regulatory Updates

This version incorporates the following recent regulatory developments:

1. ESMA's July 12, 2025 guidance on algorithmic trading requirements
2. Updated transaction reporting requirements effective June 1, 2025
3. Enhanced product governance requirements issued May 15, 2025
4. Revised best execution monitoring standards published April 30, 2025
5. Updated requirements for costs and charges disclosure issued March 25, 2025

## 2. Governance and Oversight

### 2.1 Compliance Structure

The following governance structure ensures oversight of MiFID II compliance:

| Role | Responsibilities |
|------|------------------|
| Board of Directors | - Ultimate responsibility for compliance<br>- Approval of compliance framework<br>- Regular review of compliance reports |
| Compliance Committee | - Monthly review of compliance matters<br>- Approval of compliance procedures<br>- Oversight of remediation activities |
| MiFID II Compliance Officer | - Day-to-day compliance oversight<br>- Regulatory liaison<br>- Compliance monitoring and reporting |
| Business Unit Heads | - Implementation of compliance requirements<br>- First-line monitoring<br>- Issue identification and escalation |
| Internal Audit | - Independent assessment of compliance<br>- Regular compliance audits<br>- Reporting to Board and Compliance Committee |

### 2.2 Compliance Monitoring Program

The MiFID II compliance monitoring program includes:

1. **Daily Monitoring**:
   - Transaction reporting completeness and accuracy
   - Best execution parameters
   - Algorithmic trading controls

2. **Weekly Reviews**:
   - Trade surveillance alerts
   - Client categorization changes
   - Product governance updates

3. **Monthly Assessments**:
   - Best execution quality analysis
   - Costs and charges disclosure review
   - Algorithmic trading performance

4. **Quarterly Reviews**:
   - Comprehensive compliance assessment
   - Regulatory development analysis
   - Training needs assessment

### 2.3 Reporting Structure

| Report | Frequency | Recipients | Content |
|--------|-----------|------------|---------|
| Daily Compliance Dashboard | Daily | Trading Desk, Compliance Team | Key metrics, exceptions, alerts |
| Weekly Compliance Summary | Weekly | Department Heads, Compliance Committee | Issue summary, remediation status |
| Monthly Compliance Report | Monthly | Compliance Committee, Executive Team | Comprehensive compliance status, trends, regulatory updates |
| Quarterly Compliance Review | Quarterly | Board of Directors, Regulators (as required) | Full compliance assessment, significant issues, remediation plans |

## 3. Client-Facing Requirements

### 3.1 Client Categorization

#### 3.1.1 Categorization Criteria

Clients are categorized according to the following criteria:

| Category | Criteria | Protection Level |
|----------|----------|------------------|
| Retail Clients | - Default classification for individuals<br>- SMEs not meeting professional criteria | Highest level of protection |
| Professional Clients | - Per se professionals (e.g., credit institutions, investment firms)<br>- Elective professionals meeting quantitative criteria | Medium level of protection |
| Eligible Counterparties | - Financial institutions<br>- National governments<br>- Central banks | Lowest level of protection |

#### 3.1.2 Categorization Procedures

1. **Initial Categorization**:
   - Assessment of client against categorization criteria
   - Documentation of categorization decision
   - Notification to client of categorization

2. **Re-categorization Requests**:
   - Formal request process for clients
   - Assessment of eligibility for requested category
   - Documentation of assessment and decision
   - Notification of outcome to client

3. **Periodic Review**:
   - Annual review of client categorizations
   - Assessment of continued appropriateness
   - Documentation of review outcomes

### 3.2 Costs and Charges Disclosure

#### 3.2.1 Disclosure Requirements

The following information must be disclosed to clients:

1. **Ex-ante Disclosure**:
   - All costs and charges before service provision
   - Aggregated and itemized costs
   - Cumulative effect on return
   - Illustration of cumulative effect

2. **Ex-post Disclosure**:
   - Annual statement of all costs and charges
   - Personalized costs based on actual services
   - Comparison with ex-ante disclosure

#### 3.2.2 Implementation in Platform

| Disclosure Type | Implementation Method | Responsible Team | Verification Process |
|-----------------|------------------------|------------------|---------------------|
| Ex-ante Disclosure | - Interactive cost calculator<br>- PDF disclosure document<br>- In-app notification | Product Team | Monthly review of disclosure accuracy |
| Ex-post Disclosure | - Annual statement generation<br>- Secure delivery via platform<br>- Email notification | Operations Team | Quarterly audit of statement accuracy |

#### 3.2.3 Updated Requirements (March 2025)

The platform has been updated to implement the enhanced disclosure requirements:

1. **Machine-readable Format**:
   - Structured data format for all disclosures
   - API access to cost information
   - Downloadable in multiple formats (CSV, JSON)

2. **Comparative Cost Analysis**:
   - Benchmark comparison functionality
   - Peer group cost comparison
   - Historical cost trend analysis

3. **Impact Visualization**:
   - Interactive graphs showing cost impact
   - Scenario-based cost projections
   - Long-term impact calculator

### 3.3 Best Execution

#### 3.3.1 Best Execution Policy

Our Best Execution Policy ensures that we take all sufficient steps to obtain the best possible result for clients, considering:

1. Price
2. Costs
3. Speed
4. Likelihood of execution and settlement
5. Size
6. Nature of the order
7. Any other relevant consideration

#### 3.3.2 Execution Factors Prioritization

| Client Type | Default Priority Factors | Secondary Factors |
|-------------|--------------------------|-------------------|
| Retail | 1. Total consideration (price + costs)<br>2. Speed<br>3. Likelihood of execution | 4. Size<br>5. Nature<br>6. Other considerations |
| Professional | 1. Price<br>2. Speed<br>3. Size | 4. Costs<br>5. Likelihood of execution<br>6. Other considerations |
| Eligible Counterparty | As agreed with the counterparty | As agreed with the counterparty |

#### 3.3.3 Execution Venue Selection

Execution venues are selected based on:

1. Price availability
2. Liquidity depth
3. Execution costs
4. Clearing and settlement reliability
5. Execution speed
6. Technical resilience

#### 3.3.4 Best Execution Monitoring

| Monitoring Activity | Frequency | Methodology | Responsible Team |
|--------------------|-----------|-------------|------------------|
| Transaction Cost Analysis | Real-time | - Comparison to VWAP<br>- Implementation shortfall analysis<br>- Slippage measurement | Trading Analytics |
| Execution Quality Reporting | Daily | - Price improvement statistics<br>- Speed of execution analysis<br>- Fill rate analysis | Compliance |
| Venue Performance Analysis | Monthly | - Liquidity analysis<br>- Price improvement by venue<br>- Technical performance metrics | Best Execution Committee |
| RTS 27/28 Reports | Quarterly | - Standardized regulatory reports<br>- Top five venue analysis<br>- Quality of execution summary | Compliance |

#### 3.3.5 Updated Requirements (April 2025)

The platform has been updated to implement the revised best execution monitoring standards:

1. **Enhanced Monitoring Metrics**:
   - Price reversion analysis
   - Venue toxicity measurement
   - Liquidity seeking efficiency
   - Cross-venue price comparison

2. **Consolidated Reporting**:
   - Unified dashboard for all execution metrics
   - Client-specific execution quality reports
   - Customizable reporting parameters

3. **AI-Powered Execution Analysis**:
   - Pattern recognition for execution anomalies
   - Predictive analytics for execution quality
   - Automated venue recommendation engine

## 4. Trading and Market Infrastructure

### 4.1 Transaction Reporting

#### 4.1.1 Reporting Requirements

The platform ensures complete, accurate, and timely transaction reporting:

1. **Reportable Transactions**:
   - Financial instruments admitted to trading on regulated markets
   - Financial instruments traded on MTFs or OTFs
   - Financial instruments where the underlying is traded on a trading venue
   - Derivatives referenced to benchmarks

2. **Reporting Timeframe**:
   - T+1 (by close of following business day)

3. **Reporting Fields**:
   - 65 data fields as specified in RTS 22
   - Including client identifiers, decision maker details, and instrument data

#### 4.1.2 Implementation Approach

| Component | Implementation | Validation Process |
|-----------|----------------|-------------------|
| Data Collection | - Automated extraction from trading systems<br>- Client reference data integration<br>- Instrument reference data management | Daily data completeness checks |
| Report Generation | - Real-time transaction capture<br>- Enrichment with required fields<br>- Validation against RTS 22 requirements | Pre-submission validation rules |
| Submission Process | - Direct connectivity to ARMs<br>- Automated submission scheduling<br>- Confirmation receipt tracking | Submission log monitoring |
| Exception Handling | - Error identification and categorization<br>- Automated correction where possible<br>- Escalation process for manual intervention | Daily exception report review |

#### 4.1.3 Updated Requirements (June 2025)

The platform has been updated to implement the enhanced transaction reporting requirements:

1. **Extended Instrument Coverage**:
   - Additional OTC derivatives categories
   - Expanded benchmark-referenced instruments
   - New sustainability-linked products

2. **Additional Data Fields**:
   - Sustainability factors (where applicable)
   - Algorithmic trading indicators
   - Short selling flags
   - Additional client categorization details

3. **Enhanced Validation**:
   - Cross-field validation rules
   - Market data validation
   - Reference data verification
   - Temporal consistency checks

### 4.2 Algorithmic Trading

#### 4.2.1 Algorithmic Trading Controls

The platform implements comprehensive controls for algorithmic trading:

1. **Pre-Trade Controls**:
   - Price collar checks
   - Maximum order value
   - Maximum order volume
   - Maximum message limits

2. **Post-Trade Controls**:
   - Position limit monitoring
   - P&L evaluation
   - Market risk controls
   - Credit risk controls

3. **Real-time Monitoring**:
   - Market abuse pattern detection
   - Algorithm performance monitoring
   - Technical performance monitoring
   - Market impact analysis

#### 4.2.2 Testing and Certification

| Testing Phase | Requirements | Documentation |
|---------------|--------------|---------------|
| Algorithm Testing | - Non-live environment testing<br>- Stress testing<br>- Limit testing<br>- Negative scenario testing | Test plans, results, and sign-off |
| Conformance Testing | - Trading venue conformance<br>- Protocol compliance<br>- Error handling verification | Conformance certificates |
| Annual Re-certification | - Review of algorithm changes<br>- Performance review<br>- Risk parameter review<br>- Compliance verification | Re-certification documentation |

#### 4.2.3 Kill Functionality

The platform implements multi-level kill functionality:

1. **Algorithm-Level Kill Switch**:
   - Immediate termination of specific algorithm
   - Cancellation of open orders from the algorithm
   - Logging of kill switch activation

2. **Trader-Level Kill Switch**:
   - Termination of all algorithms for a trader
   - Cancellation of all open orders for the trader
   - Notification to compliance and management

3. **Global Kill Switch**:
   - Emergency shutdown of all algorithmic trading
   - Cancellation of all open orders platform-wide
   - Escalation to senior management

#### 4.2.4 Updated Requirements (July 2025)

The platform has been updated to implement ESMA's July 2025 guidance on algorithmic trading:

1. **Enhanced Testing Requirements**:
   - Circuit breaker simulation testing
   - Cross-venue synchronization testing
   - Market stress scenario testing
   - Extreme volatility response testing

2. **Advanced Monitoring Systems**:
   - Real-time algorithm behavior profiling
   - Anomaly detection using machine learning
   - Cross-algorithm interaction analysis
   - Market impact prediction models

3. **Expanded Documentation**:
   - Detailed algorithm design documentation
   - Risk control parameter justification
   - Testing methodology documentation
   - Incident response playbooks

4. **Self-Assessment Framework**:
   - Annual algorithmic trading self-assessment
   - Independent validation of controls
   - Regulatory compliance verification
   - Continuous improvement process

### 4.3 Market Transparency

#### 4.3.1 Pre-Trade Transparency

The platform ensures compliance with pre-trade transparency requirements:

1. **Quote Publication**:
   - Real-time publication of bids and offers
   - Publication through approved channels
   - Appropriate use of waivers

2. **Systematic Internalizer Obligations**:
   - Quote publication for liquid instruments
   - Minimum quote sizes
   - Quote accessibility

#### 4.3.2 Post-Trade Transparency

The platform ensures compliance with post-trade transparency requirements:

1. **Trade Publication**:
   - Publication as close to real-time as possible
   - Required trade details
   - Appropriate use of deferrals

2. **Reporting Channels**:
   - Approved Publication Arrangements (APAs)
   - Direct reporting where applicable
   - Confirmation of successful publication

#### 4.3.3 Implementation in Platform

| Requirement | Implementation | Responsible Team |
|-------------|----------------|------------------|
| Pre-Trade Transparency | - Real-time quote publication engine<br>- Waiver eligibility determination<br>- Publication channel integration | Trading Technology |
| Post-Trade Transparency | - Trade publication workflow<br>- Deferral eligibility assessment<br>- APA connectivity | Trading Operations |
| Record Keeping | - 5-year storage of all relevant data<br>- Searchable archive<br>- Audit trail of publications | Data Management |

## 5. Product Governance

### 5.1 Product Approval Process

#### 5.1.1 Target Market Assessment

Each financial instrument offered through the platform undergoes a target market assessment:

1. **Target Market Criteria**:
   - Client type (retail, professional, eligible counterparty)
   - Knowledge and experience
   - Financial situation and ability to bear losses
   - Risk tolerance and compatibility
   - Client objectives and needs

2. **Negative Target Market**:
   - Explicit identification of unsuitable client segments
   - Documentation of incompatibility reasons
   - Controls to prevent distribution to negative target market

#### 5.1.2 Product Testing

All products undergo testing before being offered to clients:

1. **Scenario Analysis**:
   - Performance under different market conditions
   - Stress testing of product features
   - Assessment of risk/reward profile

2. **Charging Structure Analysis**:
   - Impact of fees on returns
   - Comparison with similar products
   - Value for money assessment

#### 5.1.3 Ongoing Monitoring

Products are subject to ongoing monitoring:

1. **Regular Reviews**:
   - Quarterly review of product performance
   - Assessment of continued target market appropriateness
   - Evaluation of client complaints and feedback

2. **Trigger Events**:
   - Significant market events
   - Regulatory changes
   - Changes to product features

### 5.2 Distribution Strategy

#### 5.2.1 Distribution Channels

The platform implements controls for appropriate distribution:

1. **Channel Assessment**:
   - Evaluation of distribution channel suitability
   - Alignment with target market needs
   - Information requirements for distributors

2. **Distributor Oversight**:
   - Due diligence on distributors
   - Regular assessment of distribution activities
   - Information sharing arrangements

#### 5.2.2 Information Exchange

The platform facilitates information exchange between manufacturer and distributor:

1. **Information to Distributors**:
   - Target market definition
   - Appropriate distribution strategy
   - Product features and risks

2. **Information from Distributors**:
   - Sales data and patterns
   - Client complaints
   - Target market feedback

### 5.3 Enhanced Requirements (May 2025)

The platform has been updated to implement the enhanced product governance requirements:

1. **Sustainability Factors**:
   - Integration of sustainability preferences in target market assessment
   - Sustainability risk evaluation in product testing
   - Sustainability-related information in product documentation

2. **Value for Money Assessment**:
   - Enhanced cost-benefit analysis
   - Benchmark comparison framework
   - Client outcome measurement

3. **Product Intervention Monitoring**:
   - Proactive identification of potential intervention triggers
   - Regular assessment against intervention criteria
   - Remediation planning for potential issues

4. **Cross-Border Considerations**:
   - Country-specific target market adjustments
   - Local regulatory requirement integration
   - Cross-border distribution controls

## 6. Record Keeping

### 6.1 Record Keeping Requirements

The platform maintains records in accordance with MiFID II requirements:

1. **Scope of Records**:
   - Client orders and transactions
   - Client communications
   - Client agreements
   - Suitability and appropriateness assessments
   - Algorithmic trading systems and controls
   - Transaction reporting

2. **Retention Period**:
   - Minimum 5 years (7 years where requested by competent authority)

3. **Record Format**:
   - Durable medium
   - Searchable format
   - Tamper-proof storage

### 6.2 Implementation Approach

| Record Type | Storage Method | Retention Period | Access Controls |
|-------------|----------------|------------------|----------------|
| Client Orders | - Primary database storage<br>- Daily backups<br>- Immutable audit logs | 7 years | Role-based access with MFA |
| Client Communications | - Encrypted communication archive<br>- Full text indexing<br>- Metadata tagging | 7 years | Compliance team access only |
| Trading Algorithm Records | - Version control system<br>- Change management documentation<br>- Test results archive | 7 years | Development and compliance team access |
| Transaction Reports | - Dedicated reporting database<br>- Original and corrected reports<br>- Submission receipts | 7 years | Reporting team and compliance access |

### 6.3 Record Retrieval

The platform enables efficient record retrieval:

1. **Search Capabilities**:
   - Multi-criteria search
   - Full-text search for communications
   - Date range filtering
   - Client and instrument filtering

2. **Regulatory Access**:
   - Dedicated portal for regulator access
   - Bulk export functionality
   - Audit trail of regulator access

## 7. Training and Competence

### 7.1 Training Program

The platform is supported by a comprehensive training program:

1. **Initial Training**:
   - MiFID II fundamentals
   - Role-specific requirements
   - Platform compliance features
   - Procedural training

2. **Ongoing Training**:
   - Quarterly regulatory updates
   - Annual refresher training
   - Ad-hoc training for significant changes
   - Remedial training based on monitoring

### 7.2 Competence Assessment

Staff competence is regularly assessed:

1. **Assessment Methods**:
   - Knowledge tests
   - Scenario-based assessments
   - Performance monitoring
   - Compliance reviews

2. **Documentation**:
   - Training records
   - Assessment results
   - Competence certification
   - Continuing professional development

## 8. Compliance Monitoring and Reporting

### 8.1 Monitoring Program

The platform implements a comprehensive monitoring program:

1. **Automated Monitoring**:
   - Transaction reporting completeness and accuracy
   - Best execution parameters
   - Algorithmic trading controls
   - Target market compliance

2. **Manual Reviews**:
   - Client communications sampling
   - Product governance effectiveness
   - Costs and charges disclosure
   - Complaint analysis

### 8.2 Compliance Reporting

Regular compliance reporting includes:

1. **Internal Reporting**:
   - Daily compliance dashboard
   - Weekly exception reports
   - Monthly compliance summary
   - Quarterly board report

2. **Regulatory Reporting**:
   - RTS 27/28 reports (best execution)
   - Transaction reporting
   - Suspicious transaction and order reports
   - Ad-hoc regulatory requests

## 9. Implementation in Multi-Region Architecture

### 9.1 EU West Region Implementation

The EU West (Ireland) region serves as the primary region for MiFID II compliance:

1. **Technical Implementation**:
   - Dedicated compliance infrastructure
   - EU-specific data storage
   - Regional reporting connections
   - Local monitoring systems

2. **Organizational Implementation**:
   - EU-based compliance team
   - Local regulatory expertise
   - Regional oversight committee
   - EU-specific training

### 9.2 Cross-Region Considerations

For clients accessing the platform from multiple regions:

1. **Regulatory Determination**:
   - Client location tracking
   - Applicable regulatory framework determination
   - Cross-border service restrictions
   - Regulatory conflict resolution

2. **Data Management**:
   - Region-specific data storage
   - Cross-region data transfer controls
   - Regional data retention policies
   - Data sovereignty compliance

## 10. Appendices

### Appendix A: Regulatory References

[Detailed list of relevant MiFID II/MiFIR articles and RTS/ITS]

### Appendix B: Key Procedures

[Links to detailed operational procedures]

### Appendix C: Reporting Templates

[Standardized reporting templates]

### Appendix D: Training Materials

[Links to training modules and materials]

## Document History

| Version | Date | Author | Approved By | Changes |
|---------|------|--------|-------------|---------|
| 1.0 | 2023-01-10 | J. Smith | Compliance Committee | Initial version |
| 2.0 | 2024-03-15 | M. Johnson | Compliance Committee | Updated for multi-region deployment |
| 2.5 | 2025-04-15 | L. Williams | Compliance Committee | Updated best execution requirements |
| 3.0 | 2025-08-16 | D. Thompson | Compliance Committee | Comprehensive update incorporating recent regulatory guidance |

## Approval

This framework has been reviewed and approved by:

- Chief Compliance Officer
- Head of Legal
- Chief Technology Officer
- Head of Trading
- Board Risk and Compliance Committee