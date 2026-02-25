-- MPL Seed Data: Categories and Subtasks
-- Inserts all CH (9 categories) and MH (10 categories) with their subtasks

-- ============================================================
-- CH Categories (Carrier Haulage) - 9 categories
-- ============================================================

-- CH 1: Dwell Report
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Dwell Report', '📋', 'CH', 1)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Announcement', 1),
  ('Trucker/Customer Follow up', 2),
  ('CH/MH Check', 3),
  ('In Transit', 4)
) AS t(label, sort_order);

-- CH 2: Routing Actions
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Routing Actions', '🔀', 'CH', 2)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('COD/DIV', 1),
  ('Misroutes', 2)
) AS t(label, sort_order);

-- CH 3: Notice Emails
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Notice Emails', '📧', 'CH', 3)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Salesforce Notice Emails', 1),
  ('Outlook Emails', 2),
  ('ICI Arrival Notice Emails', 3),
  ('Additional Trucker Charges', 4)
) AS t(label, sort_order);

-- CH 4: Manual Dispatch
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Manual Dispatch', '📦', 'CH', 4)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Sending Work Orders', 1),
  ('Adding Splits', 2),
  ('Shuttle (in FIS)', 3),
  ('No Reply / Rejections', 4),
  ('DO Corrections', 5)
) AS t(label, sort_order);

-- CH 5: Invoicing
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Invoicing', '💰', 'CH', 5)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Blume Charges', 1),
  ('TREXs', 2),
  ('Work Order Updates', 3)
) AS t(label, sort_order);

-- CH 6: 3rd Party Website
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), '3rd Party Website', '🌐', 'CH', 6)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('IMC Shuttle Review', 1),
  ('CP Billing', 2)
) AS t(label, sort_order);

-- CH 7: Rail Storage
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Rail Storage', '🚃', 'CH', 7)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Rail Storage', 1)
) AS t(label, sort_order);

-- CH 8: Report / Macro
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Report / Macro', '⚙️', 'CH', 8)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Panasonic IMAR', 1),
  ('Pre-Advise Macro', 2)
) AS t(label, sort_order);

-- CH 9: Other
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Other', '📌', 'CH', 9)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Meetings', 1),
  ('Trainings', 2),
  ('Popup Mgmt / Interruptions', 3),
  ('General Escalation', 4)
) AS t(label, sort_order);

-- ============================================================
-- MH Categories (Merchant Haulage) - 10 categories
-- ============================================================

-- MH 1: Port / Terminal Mgmt
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Port / Terminal Mgmt', '🏗️', 'MH', 1)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Line Release', 1),
  ('Dwell', 2),
  ('Announcements', 3),
  ('Rail Billing / Splits', 4),
  ('Customs Review', 5),
  ('Assigning Trucker Appts.', 6),
  ('Issuing ITs / Arriving IT', 7)
) AS t(label, sort_order);

-- MH 2: Routing Actions
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Routing Actions', '🔀', 'MH', 2)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Re Export / ROB', 1),
  ('COD/DIV', 2),
  ('Misroutes', 3),
  ('Damage / Transloads', 4)
) AS t(label, sort_order);

-- MH 3: Invoicing
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Invoicing', '💰', 'MH', 3)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Rail Storage', 1),
  ('TREX', 2)
) AS t(label, sort_order);

-- MH 4: Outlook / Notice Emails
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Outlook / Notice Emails', '📧', 'MH', 4)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Exam Management', 1),
  ('Port Communications', 2),
  ('QSCRAIL Inbox', 3),
  ('NS Container Hold Emails', 4),
  ('CPKC Invalid Commodity', 5)
) AS t(label, sort_order);

-- MH 5: Rail Billing
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Rail Billing', '🚃', 'MH', 5)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Truck Work Order', 1),
  ('Rail Work Order', 2)
) AS t(label, sort_order);

-- MH 6: Cross Border
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Cross Border', '🛃', 'MH', 6)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Rejections', 1),
  ('Abandonment', 2),
  ('A6 Release', 3),
  ('Border Exam Charges', 4),
  ('Mexico Arrival Notice', 5),
  ('Mexico Rail Billing', 6),
  ('Mexico Documentation', 7),
  ('All Truck Moves', 8)
) AS t(label, sort_order);

-- MH 7: Report / Macro
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Report / Macro', '⚙️', 'MH', 7)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('General Order', 1),
  ('TDRA', 2),
  ('OAK Macro', 3),
  ('Rail Advisory Macro', 4),
  ('IT Macro', 5),
  ('In-transit Macro', 6),
  ('Rail Report E3000 Macro', 7)
) AS t(label, sort_order);

-- MH 8: Transshipment / Barge / Omit
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Transshipment / Barge / Omit', '🚢', 'MH', 8)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Outlook Email Mgmt', 1),
  ('Master Sheet', 2),
  ('Booking Request', 3),
  ('Update Routing / WO / Split', 4),
  ('Bermuda', 5),
  ('HNL', 6),
  ('Area Organization', 7),
  ('Run Remark Macro', 8),
  ('Complete PCC', 9),
  ('Correcting Vessel Manifest', 10),
  ('Updating Routing', 11),
  ('Correcting ITs', 12),
  ('Sending / Updating Billing', 13),
  ('Withdraw / Sending Releases', 14),
  ('Customer Email Notifications', 15),
  ('Correcting Omit Errors', 16)
) AS t(label, sort_order);

-- MH 9: 3rd Party Website
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), '3rd Party Website', '🌐', 'MH', 9)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('CSX Billing', 1),
  ('Covering / Posting Rail Storage', 2),
  ('Termview (AMP)', 3)
) AS t(label, sort_order);

-- MH 10: Other
WITH cat AS (
  INSERT INTO categories (id, label, icon, team, sort_order)
  VALUES (gen_random_uuid(), 'Other', '📌', 'MH', 10)
  RETURNING id
)
INSERT INTO subtasks (category_id, label, sort_order)
SELECT cat.id, t.label, t.sort_order
FROM cat, (VALUES
  ('Meetings', 1),
  ('Trainings', 2),
  ('Popup Mgmt / Interruptions', 3),
  ('General Escalation', 4)
) AS t(label, sort_order);
