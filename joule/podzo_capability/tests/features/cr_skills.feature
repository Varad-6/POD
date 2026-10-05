Feature: Customer Receiver Skills
  Verify Customer Receiver Joule Skills for PODZO operations

Background:
  Given I log in
  And I start a new conversation

Scenario: View Incoming Deliveries
  When I say "show incoming deliveries"
  Then response has 1 message
  And first message content contains "assignments"

Scenario: Check Weight Status
  When I say "check weight reconciliation"
  Then response has 1 message
  And first message content contains "status"
