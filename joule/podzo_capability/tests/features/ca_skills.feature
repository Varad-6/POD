Feature: Company Admin Skills
  Verify Company Admin Joule Skills for PODZO operations

Background:
  Given I log in
  And I start a new conversation

Scenario: View Contracts
  When I say "show active contracts"
  Then response has 1 message
  And first message content contains "contracts"

Scenario: Check Review Queue
  When I say "show review queue"
  Then response has 1 message
  And first message content contains "exception"

Scenario: Distribute Purchase Order
  When I say "distribute purchase order 4600000018"
  Then response has 1 message
  And first message content contains "transporter"
