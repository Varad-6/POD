Feature: Transporter Admin Skills
  Verify Transporter Admin Joule Skills for PODZO operations

Background:
  Given I log in
  And I start a new conversation

Scenario: View Transporter POs
  When I say "show my purchase orders"
  Then response has 1 message
  And first message content contains "purchase_orders"

Scenario: View Open Sales Orders
  When I say "What sales orders are currently open right now?"
  Then response has 1 message
  And first message content contains "Sales Order"

Scenario: Assign Driver to Job
  When I say "assign driver to PO 4600000018"
  Then response has 1 message
  And first message content contains "driver"

Scenario: Assign Driver to Sales Order
  When I say "Assign driver Rajesh with truck MH12AB1234 to Sales Order 2318"
  Then response has 1 message
  And first message content contains "Rajesh"
