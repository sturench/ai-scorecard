# Top-level task kickoff - generate subtasks

To invoke this slash command:

```
/task-kickoff 14
```

## Purpose

This command executes the complete TaskMaster kickoff procedure for top-level tasks, generating subtasks and preparing for implementation.

## Task ID Processing

- **Task ID**: {0} (e.g., 14)
- **Task Type**: Top-level task (NO dots in ID)
- **Validation**: REJECT if subtask format (e.g., 14.1) is provided

## Pre-Flight Validation

**If subtask ID provided (contains dot)**:

```
❌ ERROR: This command is for top-level tasks only (format: 123).
You provided: {0} (subtask format)

Did you mean to use:
- /subtask-kickoff {0} (for subtask execution)
- /task-kickoff {parent_id} (for top-level task)

Please confirm your intent.
```

**⚠️ STOP and wait for user clarification**

## Step 1: Check Existing Subtasks

1. **Review Task Details**

   ```bash
   tm show {0}
   ```

2. **Evaluate Existing Subtasks**

**If subtasks exist**:

```
⚠️ Task {0} already has subtasks.

Current subtasks found:
[List existing subtasks with status]

Do you want to:
1. **Preserve existing subtasks** and work with them as-is
2. **Clear subtasks** and re-evaluate from scratch
3. **Cancel** this kickoff and manually review subtasks first

Please provide clear instructions.
```

**⚠️ STOP and wait for user decision**

**If user chooses "Preserve"**:

```
Task {0} subtasks preserved. Please use /subtask-kickoff for individual subtask execution.

Next recommended action: /subtask-kickoff {0}.1
```

**⚠️ STOP - Do not proceed with kickoff**

**If user chooses "Clear" or no subtasks exist**:

```bash
tm clear-subtasks --id={0}
```

## Step 2: Understand the Task

1. **Examine Task Context**
   - Review task description and requirements
   - Check for dependencies and constraints
   - Identify related code, tests, and documentation
   - Look for architectural implications

2. **Research and Analysis**
   - Search codebase for related implementations
   - Review existing patterns and conventions
   - Check for similar completed tasks
   - Understand integration points

3. **Document Key Findings**
   ```
   Key findings from task analysis:
   - [Technical finding 1]: [Location/implication]
   - [Constraint/dependency 2]: [Impact on implementation]
   - [Architectural consideration 3]: [System-wide effect]
   ```

**If clarification needed**:

```
Based on my analysis of Task {0}, I need clarification on:
- [Specific question 1]
- [Specific question 2]
- [Specific question 3]

Please provide guidance before I proceed with subtask generation.
```

**⚠️ STOP and wait for clarification**

## Step 3: Update Task Context (OPTIONAL - Skip to avoid duplicate subtasks)

⚠️ **WARNING: This step can cause duplicate subtask generation.**

**Only use if you need to add critical context that wasn't captured during analysis:**

```bash
tm update-task --id={0} --prompt="ONLY critical missing context:
- [Critical missing requirement]
- [Essential constraint not captured]"
```

**Recommended: Skip this step and go directly to Step 4** to avoid the duplicate subtask issue identified in testing.

## Step 4: Analyze Complexity

**Run complexity analysis with research**:

```bash
tm analyze-complexity --research --id={0}
```

This updates `.taskmaster/task-complexity-report.json` with:

- Implementation complexity assessment
- Resource requirements
- Risk factors
- Recommended breakdown approach

## Step 5: Expand Task into Subtasks

**Generate subtasks based on analysis**:

```bash
tm expand --id={0}
```

**Monitor expansion results**:

- Verify subtasks were created successfully
- Check for appropriate granularity
- Ensure logical task flow

## Step 6: Generate Subtask Details

**Create comprehensive task documentation**:

```bash
tm generate
```

This updates all TaskMaster markdown files with the new subtask structure.

## Step 7: Review and Validate

1. **Analyze Generated Subtasks**

   ```bash
   tm show {0}
   tm list --with-subtasks
   ```

2. **Quality Assessment**

**If plan looks reasonable**:

```
✅ Task {0} subtask plan generated successfully:

[List generated subtasks with brief descriptions]

This plan appropriately covers the original task because:
- [Reason 1: Complete coverage of requirements]
- [Reason 2: Logical breakdown and sequencing]
- [Reason 3: Appropriate granularity for execution]
- [Reason 4: Clear dependencies and integration points]

The subtasks are well-structured because:
- [Logical breakdown justification]
- [Implementation benefit 1]
- [User value improvement 2]

Total estimated subtasks: [count]
Complexity level: [High/Medium/Low]

Do you agree with this plan and want to proceed with implementation?
```

**If plan seems inadequate**:

```
⚠️ Task {0} subtask plan has concerns:

Generated subtasks:
[List generated subtasks]

Identified issues:
- [Specific gap 1]: [What's missing]
- [Specific gap 2]: [Why this is problematic]
- [Specific gap 3]: [How this affects quality]

The plan appears to miss:
- [Missing requirement 1]
- [Missing integration point 2]
- [Missing quality consideration 3]

Would you like to:
1. **Redo from scratch** with additional context
2. **Make specific adjustments** (please specify what changes)
3. **Proceed anyway** and adjust during implementation
4. **Cancel kickoff** and manually review requirements

Please specify your preferred approach.
```

**If user chooses "Redo from scratch"**:

1. **Update task with enhanced context**:

   ```bash
   tm update-task --id={0} --prompt="Enhanced context for retry:

   Previous attempt inadequacies:
   - [Why first attempt failed]
   - [What was missing from analysis]
   - [Gaps in understanding]

   Additional requirements discovered:
   - [New requirement 1]
   - [New constraint 2]
   - [New integration need 3]

   User clarifications and corrections:
   - [User feedback 1]
   - [User correction 2]
   - [User guidance 3]"
   ```

2. **Clear and restart**:

   ```bash
   tm clear-subtasks --id={0}
   ```

3. **Jump to Step 4**: Continue from complexity analysis with enhanced context

## Step 8: Implementation Readiness

**Upon successful plan approval**:

```
🚀 Task {0} is ready for implementation!

Next steps:
1. Start with first subtask: /subtask-kickoff {0}.1
2. Use /peer-review {0}.x after each subtask completion
3. Follow project coding standards and architecture guidelines

Success metrics to track:
- Task completion quality
- Code standards compliance
- Feature functionality
- Performance requirements

Ready to begin implementation!
```

## Error Handling

**If TaskMaster commands fail**:

```
❌ Error executing TaskMaster command: [command]
Error details: [error message]

Suggested recovery:
1. Verify TaskMaster is properly configured
2. Check if task ID {0} exists: tm show {0}
3. Try regenerating: tm generate
4. If issues persist, please investigate TaskMaster configuration

Should I attempt recovery or do you want to investigate manually?
```

**If task analysis reveals blockers**:

```
🚧 Task {0} has implementation blockers:

Blockers identified:
- [Blocker 1]: [Impact and resolution needed]
- [Blocker 2]: [Dependency that must be resolved first]
- [Blocker 3]: [Technical constraint requiring user decision]

Recommended approach:
1. Resolve blockers before subtask generation
2. Update task dependencies in TaskMaster
3. Re-run kickoff after blockers are cleared

Should I document these blockers and pause kickoff, or would you like to address them now?
```

## Usage Notes

- **Only for top-level tasks**: Use /subtask-kickoff for subtasks
- **Requires user interaction**: Multiple confirmation points ensure quality
- **Quality focused**: Validates plan before implementation begins
- **Recovery enabled**: Handles failures and inadequate plans gracefully

## Integration with Implementation Strategy

This command prepares Task {0} for the orchestrated implementation approach:

- Generates quality subtasks aligned with project goals
- Sets up proper context for /subtask-kickoff execution
- Enables /peer-review validation after each subtask
- Supports systematic implementation workflow
