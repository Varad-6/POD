Feature: Transporter Admin Skills
  Verify Transporter Admin Joule Skills for PODZO operations

Background:
  Given I log in
  And I start a new conversation

Scenario: View Transporter POs
  When I say "show my purchase orders"
  Then response has 1 message
  And first message content contains "purchase_orders"

Scenario: Assign Driver to Job
  When I say "assign driver to PO 4600000018"
  Then response has 1 message
  And first message content contains "driver"
