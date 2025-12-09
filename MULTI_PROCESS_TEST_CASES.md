# Multi-Process Extraction Test Cases

## Overview
This document describes test cases for the multi-process extraction feature (M16), which allows the orchestration engine to detect and create multiple distinct business processes from a single user message.

## Feature Description
When a user describes multiple distinct workflows in one message (e.g., "We onboard employees and we also handle customer onboarding"), the system should:
1. Detect that multiple processes are being described
2. Extract each process separately with its own steps
3. Create multiple Process objects in the database
4. Return all created processes in the response

## Test Case 1: Two Simple Processes
**Input Message:**
```
"We onboard employees and we also handle customer onboarding"
```

**Expected LLM Decision:**
```json
{
  "intent": "process_description",
  "actions": ["extract_process"],
  "intentConfidence": 0.85,
  "extractionConfidence": 0.75,
  "explanation": "I'll create both the employee onboarding and customer onboarding processes for you.",
  "data": {
    "processes": [
      {
        "processName": "Employee Onboarding",
        "processDescription": "Process for onboarding new employees",
        "steps": [
          {
            "title": "Send welcome email",
            "description": "Send initial welcome email to new employee",
            "owner": "HR",
            "inputs": ["Employee email"],
            "outputs": ["Welcome email sent"],
            "frequency": "Per new hire",
            "duration": "5 minutes"
          },
          {
            "title": "Setup accounts",
            "description": "Create accounts for email, systems access",
            "owner": "IT",
            "inputs": ["Employee details"],
            "outputs": ["Active accounts"],
            "frequency": "Per new hire",
            "duration": "30 minutes"
          }
        ]
      },
      {
        "processName": "Customer Onboarding",
        "processDescription": "Process for onboarding new customers",
        "steps": [
          {
            "title": "Send welcome email",
            "description": "Send welcome email to new customer",
            "owner": "Sales",
            "inputs": ["Customer email"],
            "outputs": ["Welcome email sent"],
            "frequency": "Per new customer",
            "duration": "5 minutes"
          },
          {
            "title": "Schedule kickoff call",
            "description": "Schedule initial kickoff call",
            "owner": "Account Manager",
            "inputs": ["Customer availability"],
            "outputs": ["Call scheduled"],
            "frequency": "Per new customer",
            "duration": "15 minutes"
          }
        ]
      }
    ]
  }
}
```

**Expected System Behavior:**
- Create 2 Process records in database
- Create 2 steps for Employee Onboarding with sequential link
- Create 2 steps for Customer Onboarding with sequential link
- Return both processes in `artifacts.createdProcesses` array
- Set UI hint to scroll to 'processes' and highlight first process

**Database Assertions:**
- Process count increases by 2
- ProcessStep count increases by 4 (2 per process)
- ProcessLink count increases by 2 (1 per process, connecting steps sequentially)

---

## Test Case 2: Three Detailed Processes
**Input Message:**
```
"Our sales process involves lead qualification and proposal creation. Our support process has ticket intake and resolution. Our billing process includes invoice generation and payment collection."
```

**Expected LLM Decision:**
```json
{
  "intent": "process_description",
  "actions": ["extract_process"],
  "intentConfidence": 0.90,
  "extractionConfidence": 0.85,
  "explanation": "I'll create three processes: Sales, Support, and Billing with their respective workflows.",
  "data": {
    "processes": [
      {
        "processName": "Sales Process",
        "processDescription": "Sales workflow from lead to proposal",
        "steps": [
          {
            "title": "Lead qualification",
            "description": "Qualify incoming leads",
            "owner": "Sales Rep",
            "inputs": ["Lead information"],
            "outputs": ["Qualified lead"],
            "frequency": "Per lead",
            "duration": "15 minutes"
          },
          {
            "title": "Proposal creation",
            "description": "Create and send proposal",
            "owner": "Sales Rep",
            "inputs": ["Qualified lead"],
            "outputs": ["Proposal sent"],
            "frequency": "Per qualified lead",
            "duration": "1 hour"
          }
        ]
      },
      {
        "processName": "Support Process",
        "processDescription": "Customer support ticket workflow",
        "steps": [
          {
            "title": "Ticket intake",
            "description": "Receive and categorize support ticket",
            "owner": "Support Agent",
            "inputs": ["Customer request"],
            "outputs": ["Categorized ticket"],
            "frequency": "Per ticket",
            "duration": "5 minutes"
          },
          {
            "title": "Resolution",
            "description": "Resolve customer issue",
            "owner": "Support Agent",
            "inputs": ["Categorized ticket"],
            "outputs": ["Resolved ticket"],
            "frequency": "Per ticket",
            "duration": "30 minutes"
          }
        ]
      },
      {
        "processName": "Billing Process",
        "processDescription": "Billing and payment workflow",
        "steps": [
          {
            "title": "Invoice generation",
            "description": "Generate customer invoice",
            "owner": "Finance",
            "inputs": ["Service details"],
            "outputs": ["Invoice"],
            "frequency": "Monthly",
            "duration": "10 minutes"
          },
          {
            "title": "Payment collection",
            "description": "Collect payment from customer",
            "owner": "Finance",
            "inputs": ["Invoice"],
            "outputs": ["Payment received"],
            "frequency": "Monthly",
            "duration": "Variable"
          }
        ]
      }
    ]
  }
}
```

**Expected System Behavior:**
- Create 3 Process records
- Create 6 steps total (2 per process)
- Create 3 sequential links (1 per process)
- All processes appear in session metadata
- UI scrolls to processes section

---

## Test Case 3: Single Process (Backward Compatibility)
**Input Message:**
```
"Our employee onboarding process has three steps: send welcome email, setup accounts, and assign mentor."
```

**Expected LLM Decision:**
```json
{
  "intent": "process_description",
  "actions": ["extract_process"],
  "intentConfidence": 0.95,
  "extractionConfidence": 0.90,
  "explanation": "I'll create the employee onboarding process with three steps.",
  "data": {
    "processName": "Employee Onboarding",
    "processDescription": "Process for onboarding new employees",
    "steps": [
      {
        "title": "Send welcome email",
        "description": "Send initial welcome email",
        "owner": "HR"
      },
      {
        "title": "Setup accounts",
        "description": "Create system accounts",
        "owner": "IT"
      },
      {
        "title": "Assign mentor",
        "description": "Assign a mentor to new employee",
        "owner": "HR"
      }
    ]
  }
}
```

**Expected System Behavior:**
- Use legacy single-process extraction path
- Create 1 Process record
- Create 3 ProcessStep records
- Create 2 sequential links
- Maintain backward compatibility

---

## Test Case 4: Validation - Process with Only 1 Step
**Input Message:**
```
"We have an approval process with one step and a review process with two steps."
```

**Expected LLM Decision:**
Should detect 2 processes, but one only has 1 step.

**Expected System Behavior:**
- Validation should fail with error: `Process "Approval Process" must have at least 2 steps`
- No processes should be created
- Error should be returned to user

---

## Test Case 5: Mixed Format (Should Clarify)
**Input Message:**
```
"We have a hiring process. Also do customer support."
```

**Expected LLM Decision:**
```json
{
  "intent": "clarification_needed",
  "actions": ["respond_only"],
  "intentConfidence": 0.45,
  "extractionConfidence": 0.30,
  "explanation": "I understand you want to create a hiring process and customer support process. Could you describe the key steps involved in each workflow? For example: 'The hiring process includes posting job, reviewing resumes, conducting interviews, and making offer. The customer support process includes receiving ticket, triaging issue, resolving problem, and following up.'",
  "data": {}
}
```

**Expected System Behavior:**
- No processes created
- Clarification request returned to user
- User must provide more detail in next message

---

## Edge Cases

### Edge Case 1: Empty Processes Array
If LLM returns `"processes": []`, should fallback to checking single process format.

### Edge Case 2: Mixed Single and Multi Format
If LLM returns both `processName` AND `processes` array, should prefer `processes` array.

### Edge Case 3: Process Name Conflicts
If two processes in the array have the same name, should create both with identical names (allow duplicates).

### Edge Case 4: Large Number of Processes
If user describes 5+ processes, should create all of them but may need to adjust response message for brevity.

---

## Implementation Checklist

- [x] Updated `OrchestrationDecision` type to support `processes` array
- [x] Updated LLM system prompt with multi-process detection examples
- [x] Modified `handleExtractProcess` to check for `processes` array
- [x] Added validation for minimum 2 steps per process in multi-process mode
- [x] Implemented loop to create each process via `extractProcessFromChat`
- [x] Updated artifacts array to include all created processes
- [x] Updated metadata to include all process IDs
- [x] Set UI hint to scroll to processes section
- [x] Maintained backward compatibility with single-process format
- [ ] Manual testing with real conversations
- [ ] Performance testing with 5+ processes in one message

---

## Manual Testing Script

### Test 1: Basic Multi-Process
1. Create a new session
2. Send message: "We onboard employees and we also handle customer onboarding"
3. Verify: 2 processes created in UI
4. Verify: Each process has at least 2 steps
5. Verify: Processes appear in timeline view

### Test 2: Three Processes
1. Create a new session
2. Send message: "Our sales process involves lead qualification and proposal. Our support process has ticket intake and resolution. Our billing process includes invoice and payment."
3. Verify: 3 processes created
4. Verify: All processes visible in workspace panel
5. Verify: Can switch between process graphs

### Test 3: Backward Compatibility
1. Create a new session
2. Send message: "Our employee onboarding has three steps: welcome email, setup accounts, assign mentor"
3. Verify: 1 process created
4. Verify: 3 steps created
5. Verify: No regression from previous behavior

### Test 4: Session Overview
1. After Test 2 (with 3 processes)
2. Send message: "Show me an overview"
3. Verify: Overview lists all 3 processes with step counts
4. Verify: All sections auto-expand
5. Verify: Timeline shows all artifacts

---

## Performance Considerations

- **Sequential Creation**: Processes are created sequentially in a for-loop. For 5+ processes, this could be slow.
- **Optimization Opportunity**: Could batch database operations or use transactions
- **LLM Token Usage**: Multi-process extraction requires larger JSON responses from LLM
- **Database Load**: Each process creation involves multiple DB queries (process + steps + links)

## Future Enhancements

1. **Parallel Process Creation**: Use `Promise.all()` to create processes in parallel
2. **Batch Step Creation**: Use `createMany()` instead of individual `create()` calls
3. **Validation Enhancement**: Check for duplicate process names and suggest disambiguation
4. **LLM Guidance**: Add examples to system prompt for common multi-process scenarios
5. **UI Enhancement**: Show progress indicator when creating multiple processes
