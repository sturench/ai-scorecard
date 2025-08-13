# Subtask Kickoff Procedure

## Usage

To invoke this slash command:

```
/subtask-kickoff 123.1
```

## Purpose

This procedure ensures consistent, focused execution of subtasks (format: 123.1) by establishing context, defining scope, and maintaining clear communication throughout the work.

## 🚨DO NOT FORGET TO USE THE AVAILABLE SUBAGENTS TO DO THE WORK!! THERE ARE SPECIALISTS AVAILABLE TO YOU

## Task ID Processing

- **Subtask ID**: {0} (e.g., 123.1)
- **Parent Task ID**: Derive from {0} by removing everything after the dot (e.g., 123.1 → 123)
- **Task Type**: Subtask (contains a dot in the ID)

## Pre-Flight Checklist

1. **Verify Task Type**

   ```
   tm show {0}
   ```

   - **If task format is 123.1**: Continue with this procedure
   - **If task format is 123 (no decimal)**:
     - Check for subtasks: `tm show {0}`
     - **If subtasks exist**: Ask user which subtask to work on
     - **If no subtasks exist**:
       ```
       This task has no subtasks. Should I:
       a) Break it down into subtasks first (I can follow the @docs/claude/workflows/taskmaster-kickoff.md procedure)
       b) Work on it as a single task (only recommended for very small tasks)
       ```
       **⚠️ STOP AND WAIT** - Only proceed with option (b) if user explicitly confirms

2. **Understand Task Hierarchy**

   ```
   tm show <PARENT_TASK_ID>  # Derive parent ID from {0} (e.g., 123.1 → 123)
   tm list --with-subtasks
   ```

   - Review all sibling subtasks for task {0}
   - Understand how this subtask fits into the parent task
   - Note any dependencies or order requirements
   - **Check for project-specific documentation requirements** in parent task description
   - **Look for existing analysis documents** that this subtask should reference or maintain

3. **Verify Working Directory**

   ```
   pwd
   ```

   - **If not at project root**: `cd` to the correct location
   - Remember: `tm` commands must be run from project root

4. **Check Git State**

   ```
   git status
   git branch --show-current
   ```

   - Note current branch
   - Ensure working directory is clean
   - **If uncommitted changes exist**: Ask user how to proceed

5. **Load Project Context**
   - Read @CLAUDE.md and identify relevant sections:
     - **If testing task**: Focus on testing guidelines
     - **If documentation**: Focus on documentation standards
     - **If feature work**: Focus on coding standards and architecture
   - Check for other relevant docs: @README.md, @CONTRIBUTING.md, `.github/` guidelines
   - **Check parent task for documentation requirements**:

     ```
     tm show <PARENT_TASK_ID>  # Derive parent ID from {0} (e.g., 123.1 → 123)
     ```

     - Look for references to specific documentation files
     - Note any cross-subtask update requirements
     - Check if parent task has established documentation workflows

   - Note any project-specific commands or workflows

## Research Phase - Intelligent Agent Handoff

### Phase Selection Based on Task Type

**Evaluate the subtask type and determine the most appropriate approach:**

1. **Complex Research-Heavy Tasks**: Use @research-analyst agent
   - Multi-system analysis requirements
   - Technology evaluation and comparison
   - Performance optimization research
   - Best practice investigation
   - Cross-system impact analysis

2. **Architectural Design Tasks**: Use @architecture-advisor agent
   - System integration design
   - API design and service boundaries
   - Data architecture decisions
   - Scalability planning
   - Technical architecture reviews

3. **Debugging and Issue Investigation**: Use @debug-specialist agent
   - Complex bug investigation
   - Performance issue diagnosis
   - Integration problem analysis
   - Intermittent failure investigation
   - Root cause analysis requirements

4. **Documentation-Heavy Tasks**: Use @doc-specialist agent
   - Comprehensive documentation creation
   - Technical writing requirements
   - User guide development
   - API documentation needs
   - Architecture documentation

5. **Standard Implementation Tasks**: Continue with current workflow
   - Simple feature implementation
   - Configuration changes
   - Minor updates and fixes

### Agent Handoff Decision

```
Task Analysis for {0}:
- **Task Type**: [Research/Architecture/Debug/Documentation/Standard Implementation]
- **Complexity Level**: [High/Medium/Low]
- **Primary Focus**: [What the task primarily involves]

Recommended approach:
- **Option A**: Hand off to [@agent-name] for specialized expertise
- **Option B**: Continue with standard implementation workflow

Would you like me to:
a) Hand off to the specialized agent (recommended for complex tasks)
b) Continue with the standard workflow
c) Get more details before deciding
```

**⚠️ STOP AND WAIT for user decision on approach**

### Standard Research Workflow (if not handed off)

1. **Understand the Problem**
   - Read the full task description for {0} carefully
   - Identify any ambiguities or missing information
   - **If unclear**: Ask user for clarification before proceeding

2. **Gather Information**
   - **For complex codebase searches**: Use Task tool for multi-round research
   - **For specific files**: Use Read, Grep, or Glob tools directly
   - **Parallel research**: When multiple independent areas need investigation, batch tool calls
   - **Sequential research**: When findings from one search inform the next
   - Search codebase for related files
   - Review any mentioned issues or PRs
   - Check for existing patterns or similar implementations
   - **Document key findings**: Structure discoveries for later reference
     ```
     Key findings from research:
     - [Finding 1]: [Location/implication]
     - [Finding 2]: [Location/implication]
     - [Finding 3]: [Location/implication]
     ```

3. **Research Confirmation**

   ```
   Based on my research, I found:
   - [Key technical finding 1]
   - [Key technical finding 2]
   - [Important constraint or dependency]

   Should I proceed with analysis based on these findings, or would you like me to investigate any specific areas further?
   ```

   **⚠️ STOP AND WAIT for user confirmation on research direction**

4. **Identify Constraints**
   - Technical limitations
   - Time/scope boundaries
   - Dependencies on other work
   - Testing requirements

## Planning Phase

1. **Define Scope Explicitly**

   ```
   Based on my research, here's what I understand subtask {0} includes:
   - [Specific deliverable 1]
   - [Specific deliverable 2]

   Out of scope:
   - [Related but separate concern 1]
   - [Future enhancement 2]

   Documentation requirements (if any):
   - [Reference/update specific documentation files]
   - [Cross-subtask updates needed]

   Is this understanding correct?
   ```

   **⚠️ STOP AND WAIT for user confirmation before proceeding**

2. **Branch Strategy**
   - **If user hasn't specified**:
     ```
     Should I create a new feature branch for this work, or work on the current branch?
     ```
     **⚠️ STOP AND WAIT for user response**
   - **If new branch needed**:
     ```
     git checkout -b feature/task-{0}-<brief-description>
     ```

3. **Propose Approach**

   ```
   Here's my planned approach for subtask {0}:

   1. [First major step]
      - Validation: [How we'll know this succeeded]
   2. [Second major step]
      - Validation: [How we'll know this succeeded]
   3. [Third major step]
      - Validation: [How we'll know this succeeded]

   Cross-subtask updates planned:
   - [Related subtask]: [What information will be shared]
   - [Another subtask]: [What updates will be made]

   Estimated checkpoints:
   - After step 1: Review [specific aspect]
   - After step 2: Test [specific functionality]

   Does this approach look good?
   ```

   **⚠️ STOP AND WAIT for user approval before starting execution**

4. **Create Parking Lot**

   ```
   I'll track any discoveries that are out of scope in @PARKING_LOT.md:
   - [ ] (Items will be added here during execution)
   ```

5. **Create Todo List (For Complex Subtasks)**
   - **If subtask has multiple distinct components**: Use TodoWrite tool to track progress
   - **When to use todos**:
     - Subtask involves 4+ distinct steps or deliverables
     - Multiple files/systems need to be analyzed
     - Cross-task updates are required
   - **When NOT to use todos**:
     - Simple, single-focus subtasks
     - Pure research or reading tasks
   ```
   I'll create a todo list to track the multiple components of subtask {0}:
   [List the main components as separate todos]
   ```

## Execution Phase

1. **Work in Iterations**
   - Complete one logical chunk at a time
   - Test/validate before moving to next chunk
   - **After each major change**: Summarize what was done

2. **Maintain Focus**
   - **If discovering related issues**:
     ```
     I found [issue] which is related but outside our current scope for subtask {0}.
     Should I:
     a) Add it to @PARKING_LOT.md for a future task?
     b) Expand scope to include it?
     c) Make a quick fix now?
     ```
     **⚠️ STOP AND WAIT for user choice**
   - Default to option (a) unless user specifies otherwise
   - **When adding to parking lot**:
     ```
     echo "- [ ] [Description of issue/enhancement]" >> PARKING_LOT.md
     ```

3. **Track TODOs**
   - **For action items discovered during work**:
     - Document them clearly in your progress updates
     - Add them to the TodoWrite list if using todo tracking
     - Or add them to PARKING_LOT.md if they're out of scope
   - **If using TodoWrite tool**: Update todo status as work progresses
     - Mark todos as "in_progress" when starting
     - Mark as "completed" immediately upon finishing each component
     - Never batch todo completions - update in real-time
   - **Before considering task done**:
     - Review all identified action items
     - Ensure each has been addressed or properly deferred
     - Confirm no forgotten TODOs in comments or notes

4. **Update Task Management System**
   - **During execution**: Update subtask with findings using `tm update-subtask`
   - **Cross-subtask updates**: If discoveries affect related subtasks, update them
     ```
     tm update-subtask --id=<SIBLING_SUBTASK_ID> --prompt="Implementation findings: [relevant discoveries]"
     ```
   - **Documentation requirements**: If parent task specifies documentation to maintain, update it during execution
   - **When to update**:
     - After major discoveries or analysis completion
     - When findings impact other subtasks
     - Before moving to validation phase

5. **Regular Check-ins**
   - **After significant progress**:

     ```
     Progress update on subtask {0}:
     ✓ Completed: [what's done]
     → Current: [what I'm working on]
     ⧖ Next: [what's coming up]

     Any concerns or adjustments needed?
     ```

6. **Handle Errors Gracefully**
   - **When something fails**:
     1. Document what went wrong
     2. Explain why it likely failed
     3. Propose fix approach
     4. **After 2-3 failed attempts**:
        ```
        I've tried [approaches] but am still encountering [issue] in subtask {0}.
        Would you like me to:
        a) Try a different approach: [alternative]
        b) Research the issue more deeply
        c) Move on and document this as a known issue
        ```

## Validation Phase

1. **Verify Completion**
   - Run all relevant tests
   - Check that original requirements for subtask {0} are met
   - Ensure no regressions introduced
   - **If documentation requirements existed**: Verify all required documents are updated
   - **If cross-subtask updates were planned**: Confirm all related subtasks are updated
   - **Never assume completion** - always validate

2. **Architectural Validation**
   - LEFT EMPTY INTENTIONALLY FOR NOW

3. **User Confirmation with Quality Options**

   ```
   I believe subtask {0} is complete. Here's what was accomplished:

   ✓ [Deliverable 1] - [brief validation]
   ✓ [Deliverable 2] - [brief validation]

   Documentation updated:
   - [Document 1]: [what was added/changed]
   - [Document 2]: [what was added/changed]

   Cross-subtask updates completed:
   - [Related subtask]: [information shared]
   - [Another subtask]: [updates made]

   Testing performed:
   - [Test type 1]: [result]
   - [Test type 2]: [result]

   Quality Assurance Options:
   a) **Basic review**: Review the changes in detail yourself
   b) **Enhanced testing**: Run additional tests and validation
   c) **Comprehensive QA**: Use @quality-assurance-coordinator for multi-expert review (recommended for complex/critical changes)
   d) **Standard completion**: Consider this complete and move on

   Which quality assurance approach would you prefer?
   ```

   **⚠️ STOP AND WAIT for user decision**

## Handoff Phase

1. **Document Work**

   ```
   Summary for subtask {0}:
   - Implemented: [concise list]
   - Key decisions: [any important choices made]
   - Location of changes: [files/directories affected]
   - Cross-subtask impacts: [other subtasks affected by this work]
   ```

2. **Update Documentation and Related Tasks**
   - **If parent task specifies documentation**: Update required documents with implementation details
   - **Cross-subtask updates**: Ensure related subtasks have been updated with relevant findings
   - **Move completed items**: In tracking documents, move items from "Pending" to "Implemented" sections

3. **Update Task Status**
   - **Only if user confirms completion**:
     ```
     tm set-status --id={0} --status=done
     ```

4. **Handle Parking Lot**
   - **Check for parking lot file**:
     ```
     cat PARKING_LOT.md
     ```
   - **If items exist**:

     ```
     During work on subtask {0}, I noted these items for potential future tasks:
     [Contents of @PARKING_LOT.md]

     Would you like me to:
     a) Create tasks for any of these items
     b) Keep the file for later review
     c) Remove the file (items will be lost)
     ```

   - **If user chooses (a) - Create tasks**:
     ```
     For each item, should I create:
     1) A new top-level task: tm add-task --prompt="<description>"
     2) A subtask under the parent task: tm add-subtask --parent=<PARENT_TASK_ID> --title="<title>"
     ```
   - **Never commit @PARKING_LOT.md** unless user explicitly requests it
   - **Clean up**:
     ```
     rm PARKING_LOT.md  # Only after user decision
     ```

5. **Clean Up**
   - Ensure all changes are committed
   - Branch is in correct state
   - Working directory is clean

## Key Reminders

- **Subtasks only**: This procedure is for tasks in format 123.1
- **STOP AND WAIT**: Always pause for user responses at ⚠️ marked points - never continue past questions
- **Stay focused**: Resist scope creep without user approval
- **Communicate clearly**: Regular updates and explicit confirmation requests
- **Preserve context**: Document learnings in @PARKING_LOT.md
- **Track todos**: Use Claude Code's todo system for action items
- **Validate thoroughly**: Never assume - always verify
- **Location matters**: Run commands from correct directories
- **Clean commits**: Never commit @PARKING_LOT.md without explicit permission
