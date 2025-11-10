-- ===============================
-- seed.sql
-- Coastal Carolina Parking Database Seed Data
-- ===============================

BEGIN;

-- Campuses
INSERT INTO campuses (name, description) VALUES
('Main Campus', 'Primary campus where most classrooms and student lots are located.'),
('East Campus', 'East campus with science center and some lots.'),
('Off-Campus/Shuttle', 'Distant lots served by shuttle.');

-- Lot types
INSERT INTO lot_types (code, description) VALUES
('SURF', 'Surface lot'),
('GATED', 'Gated / reserved lot'),
('EVENT', 'Event / stadium lot'),
('ADA', 'ADA accessible lot');

-- Lots
INSERT INTO lots (campus_id, code, display_name, lot_type_id, capacity, is_ada, is_reserved, requires_permit, location_desc, notes)
VALUES
((SELECT campus_id FROM campuses WHERE name='Main Campus'), 'KK', 'KK Lot (behind Lackey Chapel / Public Safety)', (SELECT lot_type_id FROM lot_types WHERE code='SURF'), 180, FALSE, FALSE, TRUE, 'Behind Lackey Chapel / near Public Safety', 'Fills early on class days.'),
((SELECT campus_id FROM campuses WHERE name='Main Campus'), 'GG', 'GG Lot (behind Baxley Hall)', (SELECT lot_type_id FROM lot_types WHERE code='SURF'), 220, FALSE, FALSE, TRUE, 'Off Hwy 501, near Baxley Hall', 'Often fills early.'),
((SELECT campus_id FROM campuses WHERE name='Main Campus'), 'QQ', 'QQ Lot (Brooks Stadium lot)', (SELECT lot_type_id FROM lot_types WHERE code='EVENT'), 286, FALSE, FALSE, TRUE, 'Adjacent to Brooks Stadium', 'Expanded to 286 spaces from ~200.'),
((SELECT campus_id FROM campuses WHERE name='Off-Campus/Shuttle'), 'YY', 'YY Lot (off Hwy 544)', (SELECT lot_type_id FROM lot_types WHERE code='SURF'), 300, FALSE, FALSE, FALSE, 'Off Highway 544; shuttle service to main campus', 'Underutilized relative to main campus.'),
((SELECT campus_id FROM campuses WHERE name='East Campus'), 'BBB', 'BBB Lot (East Campus)', (SELECT lot_type_id FROM lot_types WHERE code='SURF'), 150, FALSE, FALSE, TRUE, 'East campus lot', 'Less used; shuttle access.'),
((SELECT campus_id FROM campuses WHERE name='East Campus'), 'DDD', 'DDD Lot (Coastal Science Center / ADA)', (SELECT lot_type_id FROM lot_types WHERE code='ADA'), 60, TRUE, FALSE, TRUE, 'At Coastal Science Center, east campus. ADA lot across Hwy 501 for stadium', 'ADA-designated; shuttle may serve.');

-- Permits
INSERT INTO permits (name, description, valid_for, cost_cents, seasonal) VALUES
('Student', 'Undergraduate & graduate student permit', 'Designated student lots', 2500, FALSE),
('Faculty/Staff', 'Faculty and staff permit', 'Faculty/staff lots', 4000, FALSE),
('Visitor', 'Short-term visitor parking', 'Visitor and metered lots', 0, FALSE),
('Event (Game Day)', 'Paid event parking for games', 'Event lots only', 1500, TRUE);

-- Shuttle routes
INSERT INTO shuttle_routes (name, origin, destination, typical_wait_minutes_min, typical_wait_minutes_max, notes) VALUES
('YY-Main Shuttle', 'YY Lot', 'Main Campus', 10, 15, 'Serves YY lot; 10–15 min wait.'),
('BBB-DDD Shuttle', 'East Campus Lots (BBB/DDD)', 'Main Campus', 10, 20, 'Serves east campus; up to 30 min wait at peak.'),
('Event Shuttle', 'Satellite Lots', 'Brooks Stadium / Main Campus', 5, 15, 'Runs frequently on game days.');

-- Shuttle stops
INSERT INTO shuttle_stops (route_id, stop_order, stop_name, near_lot_id, estimated_boarding_minutes) VALUES
((SELECT route_id FROM shuttle_routes WHERE name='YY-Main Shuttle'), 1, 'YY Lot - Park & Ride', (SELECT lot_id FROM lots WHERE code='YY'), 2),
((SELECT route_id FROM shuttle_routes WHERE name='YY-Main Shuttle'), 2, 'Main Campus - Central Hub', NULL, 2),

((SELECT route_id FROM shuttle_routes WHERE name='BBB-DDD Shuttle'), 1, 'BBB Lot Stop', (SELECT lot_id FROM lots WHERE code='BBB'), 2),
((SELECT route_id FROM shuttle_routes WHERE name='BBB-DDD Shuttle'), 2, 'DDD Lot Stop (ADA)', (SELECT lot_id FROM lots WHERE code='DDD'), 2),
((SELECT route_id FROM shuttle_routes WHERE name='BBB-DDD Shuttle'), 3, 'Main Campus - Central Hub', NULL, 2),

((SELECT route_id FROM shuttle_routes WHERE name='Event Shuttle'), 1, 'Satellite Lot', NULL, 2),
((SELECT route_id FROM shuttle_routes WHERE name='Event Shuttle'), 2, 'Brooks Stadium Entrance', (SELECT lot_id FROM lots WHERE code='QQ'), 2);

-- Usage stats
INSERT INTO lot_usage_stats (lot_id, sample_date, occupied_count, peak_hour, notes) VALUES
((SELECT lot_id FROM lots WHERE code='KK'), '2025-09-15', 175, '09:30:00', 'Nearly full weekday morning.'),
((SELECT lot_id FROM lots WHERE code='GG'), '2025-09-15', 215, '09:15:00', 'Fills early.'),
((SELECT lot_id FROM lots WHERE code='QQ'), '2025-09-15', 260, '11:00:00', 'High use event/non-event days.'),
((SELECT lot_id FROM lots WHERE code='YY'), '2025-09-15', 80, '10:00:00', 'Underutilized.'),
((SELECT lot_id FROM lots WHERE code='BBB'), '2025-09-15', 65, '10:30:00', 'Light usage.'),
((SELECT lot_id FROM lots WHERE code='DDD'), '2025-09-15', 40, '10:30:00', 'ADA lot, low occupancy.');

-- Capacity change
INSERT INTO capacity_changes (lot_id, changed_on, old_capacity, new_capacity, reason)
VALUES
((SELECT lot_id FROM lots WHERE code='QQ'), '2024-08-01', 200, 286, 'Brooks Stadium expansion');

-- Event
INSERT INTO events (name, event_date, expected_attendance, extra_parking, notes)
VALUES
('Coastal Football vs Rival', '2025-10-04', 20000, TRUE, 'Game day: paid lots, ADA support, extra shuttles.');

-- Rules
INSERT INTO parking_rules (short_code, description, effective_from) VALUES
('DECAL_REQ', 'Parking decal required; violators cited/towed.', '2024-08-01'),
('ADA_ONLY', 'ADA spaces reserved for authorized vehicles only.', '2024-08-01'),
('EVENT_PARK', 'Game day lots become paid lots.', '2024-08-01');

-- Campus totals
INSERT INTO campus_parking_summary (campus_id, total_spaces, student_spaces, faculty_staff_spaces, last_updated)
VALUES
((SELECT campus_id FROM campuses WHERE name='Main Campus'), 3300, 2200, 800, '2025-09-15'),
((SELECT campus_id FROM campuses WHERE name='East Campus'), 800, 400, 300, '2025-09-15'),
((SELECT campus_id FROM campuses WHERE name='Off-Campus/Shuttle'), 1700, 1200, 100, '2025-09-15');

COMMIT;
