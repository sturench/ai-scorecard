# Quality Assurance Review Slash Command

To invoke this slash command:
```
/peer-review 14.3
```

## Purpose
This command engages the @quality-assurance-coordinator agent to orchestrate a comprehensive multi-dimensional quality review of completed subtask work, ensuring highest standards across architecture, functionality, security, performance, testing, and user experience.

## Task ID Processing
- **Subtask ID**: {0} (e.g., 14.3)
- **Parent Task ID**: Derive from {0} by removing everything after the dot (e.g., 14.3 → 14)
- **Task Type**: Subtask review (contains a dot in the ID)

## Agent Handoff Process

### Step 1: Context Preparation
```
I'll now hand off to the @quality-assurance-coordinator agent for comprehensive quality review of subtask {0}.

Context being provided to QA Coordinator:
- **Subtask ID**: {0}
- **Parent Task**: [Derived from {0}]
- **Completion Scope**: [What was implemented]
- **Key Changes**: [Files and components modified]
- **Testing Performed**: [Tests run and results]

Engaging @quality-assurance-coordinator now...
```

### Step 2: Quality Assurance Coordination
*The @quality-assurance-coordinator agent will take over and conduct:*

1. **Context Gathering**: 
   - Task information retrieval
   - Parent task context review
   - Recent changes identification
   - Impact assessment

2. **Multi-Expert Review Orchestration**:
   - Architecture review
   - Functional quality assessment
   - Security evaluation
   - Performance analysis
   - Testing coverage review
   - User experience validation

3. **Quality Decision and Recommendations**:
   - Overall quality assessment
   - Deployment readiness determination
   - Specific improvement recommendations
   - Risk mitigation strategies

### Step 3: Results Integration
*The QA Coordinator will provide:*
- Comprehensive quality assessment report
- Clear deployment recommendation (Approved/Conditional/Rejected)
- Specific action items if improvements needed
- Quality monitoring recommendations

## Legacy Multi-Expert Review Process
*The following sections are maintained for reference but replaced by the @quality-assurance-coordinator agent workflow*

#### 🏗️ Architect Review
**Persona**: Senior System Architect with expertise in RAG systems and chunk-based architectures
**Focus**: Architectural integrity and system-wide implications

```
## Architect Review for Subtask {0}

### Architectural Alignment Assessment:
- **Chunk Architecture Advancement**: [Does this move us toward chunk-based precision?]
- **Integration Integrity**: [How well does this integrate with existing sophisticated features?]
- **Cross-Visa Strategy**: [Does this properly handle universal content like naturalization laws?]
- **Scalability Impact**: [Will this work at 30-60x vector scale?]
- **Technical Debt**: [Any architectural shortcuts that will cause problems later?]

### System-Wide Implications:
- **Breaking Changes**: [Any changes that affect other components?]
- **Performance Impact**: [Effect on <500ms response time requirement?]
- **Metadata Schema**: [Proper visa_type, language, source tracking?]

### Architectural Concerns (if any):
- [Specific concern 1]: [Impact and recommended fix]
- [Specific concern 2]: [Impact and recommended fix]

### Architectural Approval: ✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED
**Rationale**: [Brief explanation of decision]
```

#### 🔍 QA Manager Review  
**Persona**: Quality Assurance Manager focused on testing standards and regression prevention
**Focus**: Quality standards, testing coverage, and production readiness

```
## QA Manager Review for Subtask {0}

### Testing Coverage Assessment:
- **Unit Tests**: [Coverage of new/modified functionality]
- **Integration Tests**: [Testing of component interactions]
- **Performance Tests**: [Response time and scale testing]
- **Cross-Language Tests**: [Portuguese-English functionality testing]

### Quality Standards Verification:
- **Code Quality**: [Linting, type checking, formatting standards]
- **Error Handling**: [Proper exception handling and user feedback]
- **Edge Cases**: [Boundary condition testing]
- **Regression Prevention**: [Tests prevent breaking existing functionality]

### Production Readiness:
- **Environment Isolation**: [Proper test/dev/prod separation]
- **Configuration Management**: [No hardcoded values or secrets]
- **Logging & Monitoring**: [Appropriate logging for debugging]
- **Rollback Capability**: [Can changes be safely reverted?]

### Quality Concerns (if any):
- [Quality issue 1]: [Risk level and fix needed]
- [Quality issue 2]: [Risk level and fix needed]

### QA Approval: ✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED
**Rationale**: [Brief explanation of decision]
```

#### 📊 Product Manager Review
**Persona**: Product Manager focused on user value and business requirements
**Focus**: User value delivery and requirement fulfillment

```
## Product Manager Review for Subtask {0}

### User Value Assessment:
- **Visa Precision Improvement**: [How does this improve >90% visa-specific accuracy?]
- **User Experience Impact**: [What will users notice that's better?]
- **Content Accessibility**: [Does this help English queries find Portuguese content?]
- **Performance User Impact**: [Maintains smooth user experience?]

### Requirements Fulfillment:
- **Original Subtask Goals**: [Does this complete what was promised?]
- **Gap Analysis Alignment**: [Addresses identified system gaps?]
- **Implementation Roadmap**: [Fits within planned value delivery?]

### Business Risk Assessment:
- **Deployment Risk**: [Safe to deploy without user disruption?]
- **Data Integrity**: [No risk of corrupting user data or sources?]
- **Feature Completeness**: [Ready for user testing or needs more work?]

### Product Concerns (if any):
- [User impact concern 1]: [Effect on user experience]
- [Business risk concern 2]: [Potential negative outcome]

### Product Approval: ✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED
**Rationale**: [Brief explanation of decision]
```

#### 🔒 Security Expert Review
**Persona**: Security specialist focused on data protection and system security
**Focus**: Security implications and data safety

```
## Security Expert Review for Subtask {0}

### Security Impact Assessment:
- **Data Protection**: [User data and immigration content properly protected?]
- **API Security**: [No new security vulnerabilities in endpoints?]
- **Input Validation**: [Proper sanitization of user inputs?]
- **Authentication Integration**: [Compatible with planned auth system?]

### Portuguese Legal Content Security:
- **Content Integrity**: [Legal content remains unmodified and accurate?]
- **Source Attribution**: [Proper citation prevents misattribution?]
- **Cross-Language Safety**: [Translation/enhancement doesn't alter legal meaning?]

### Infrastructure Security:
- **Environment Isolation**: [Test data can't contaminate production?]
- **Configuration Security**: [No secrets or credentials exposed?]
- **Access Control**: [Proper permissions on files and databases?]

### Security Concerns (if any):
- [Security issue 1]: [Vulnerability and mitigation needed]
- [Security issue 2]: [Risk level and fix required]

### Security Approval: ✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED
**Rationale**: [Brief explanation of decision]
```

#### ⚡ Performance Engineer Review
**Persona**: Performance specialist focused on system efficiency and scalability
**Focus**: Performance implications and resource optimization

```
## Performance Engineer Review for Subtask {0}

### Performance Impact Assessment:
- **Response Time**: [Maintains <500ms query response requirement?]
- **Memory Usage**: [Efficient memory utilization for 30-60x scale?]
- **Database Performance**: [Vector operations optimized?]
- **Batch Processing**: [Handles chunk volume efficiently?]

### Scalability Validation:
- **Vector Scale**: [Works with 15,000-30,000 chunks?]
- **Concurrent Users**: [Performance under multiple simultaneous queries?]
- **Portuguese Content**: [Cross-language processing doesn't add excessive overhead?]

### Resource Optimization:
- **CPU Efficiency**: [Algorithms optimized for computational efficiency?]
- **I/O Operations**: [Database queries and file operations minimized?]
- **Caching Strategy**: [Appropriate caching to reduce redundant work?]

### Performance Concerns (if any):
- [Performance issue 1]: [Bottleneck and optimization needed]
- [Performance issue 2]: [Scalability risk and solution]

### Performance Approval: ✅ APPROVED / ⚠️ CONCERNS / ❌ REJECTED
**Rationale**: [Brief explanation of decision]
```

### Phase 3: Review Synthesis

#### Overall Assessment Matrix:
```
| Expert Role        | Approval Status | Key Concerns |
|-------------------|-----------------|--------------|
| Architect         | [✅/⚠️/❌]      | [concerns]   |
| QA Manager        | [✅/⚠️/❌]      | [concerns]   |
| Product Manager   | [✅/⚠️/❌]      | [concerns]   |
| Security Expert   | [✅/⚠️/❌]      | [concerns]   |
| Performance Eng   | [✅/⚠️/❌]      | [concerns]   |
```

#### Final Recommendation:

**If All Approved (✅✅✅✅✅)**:
```
🎉 PEER REVIEW PASSED - Subtask {0} Ready for Completion

All expert reviews approved this work with no significant concerns.
The implementation properly advances the chunk-based architecture 
while maintaining quality, security, and performance standards.

Recommended next action: Mark subtask as complete and proceed to next task.
```

**If Minor Concerns (some ⚠️)**:
```
⚠️ PEER REVIEW: MINOR CONCERNS - Action Required

The following concerns need attention before completion:

[List each ⚠️ concern with specific action needed]

Recommended approach:
1. Address the identified concerns
2. Re-run specific expert reviews as needed  
3. Proceed with completion once concerns resolved

Estimated time to resolve: [estimate]
```

**If Major Issues (any ❌)**:
```
❌ PEER REVIEW: MAJOR ISSUES - Rework Required

Critical issues identified that require significant changes:

[List each ❌ rejection with detailed remediation plan]

Recommended approach:
1. Stop current work and address critical issues
2. Consider consulting with user on approach
3. Re-implement problematic areas
4. Run full peer review again after fixes

This subtask is NOT ready for completion.
```

### Phase 4: Action Items

Based on review outcomes:

1. **For PASSED reviews**: 
   - Document successful peer review in subtask
   - Provide summary of validation completed
   - Ready for user to mark task complete

2. **For MINOR CONCERNS**:
   - Create specific action items for each concern
   - Provide estimates for resolution time
   - Suggest order of addressing concerns

3. **For MAJOR ISSUES**:
   - Create detailed remediation plan
   - Recommend discussing with user before proceeding
   - Suggest breaking into smaller, safer changes

## Usage Notes

- **Agent-Driven Quality**: The @quality-assurance-coordinator agent provides comprehensive, systematic quality review
- **Multi-Dimensional Assessment**: Reviews cover architecture, functionality, security, performance, testing, and UX
- **Actionable Results**: All recommendations include specific next steps and timelines
- **Context-Aware Review**: Assessment considers the subtask's role in overall system architecture
- **User Value Focus**: Quality decisions tied directly to user impact and business outcomes

## Integration with Subtask Workflow

This quality assurance review should be run:
- After subtask implementation is complete
- Before marking subtask as done
- When user selects comprehensive QA option in subtask validation phase
- Any time concerns arise about work quality or architectural fit
- For all critical or complex subtasks affecting core system functionality

The quality assurance results provide clear deployment decisions and specific improvement guidance to ensure subtasks meet the highest standards before completion.