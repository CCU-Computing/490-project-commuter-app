-- 02_parking_lot_seed.sql
-- Simple seed for manual stats table: public.parking_lots

INSERT INTO parking_lots (code, name, capacity) VALUES
  ('a',   'A Parking (Wall Building)',                              150),
  ('aa',  'AA Parking (HTC Center)',                                150),
  ('b',   'B Parking (Penny Hall)',                                  150),
  ('bb',  'BB Parking (Woods Residence Halls)',                     150),
  ('bbb', 'BBB Parking (Burroughs & Chapin Center)',                150),
  ('c',   'C Parking (Penny Hall)',                                  150),
  ('cc',  'CC Parking (road in front of Hicks Dining Hall)',        150),
  ('ccc', 'CCC Parking (Burroughs & Chapin Center)',                150),
  ('d',   'D Parking (Smith Building)',                              150),
  ('dd',  'DD Parking (behind Hicks Dining Hall)',                  150),
  ('ddd', 'DDD Parking (Coastal Science Center)',                   150),
  ('e',   'E Parking (LJSU/Spadoni Park)',                          150),
  ('ee',  'EE Parking (Woods Residence Halls)',                     150),
  ('fff', 'FFF Parking (Intermural Fields)',                        150),
  ('gg',  'GG Parking (across the way from LJSU)',                  150),
  ('ggg', 'GGG Parking (Atlantic Hall)',                            150),
  ('h',   'H Parking ()',                                            150),
  ('hh',  'HH Parking (across road from Douglas and Swain)',       150),
  ('hhh', 'HHH Parking (Soccer Stadium)',                           150),
  ('i',   'I Parking ()',                                            150),
  ('ii',  'II Parking (Horry County Scholars Academy)',             150),
  ('j',   'J Parking (by Atheneum Hall and Indigo Hall)',           150),
  ('jjj', 'JJJ Parking',                                            150),
  ('kk',  'KK Parking',                                             150),
  ('ll',  'LL Parking',                                             150),
  ('m',   'M Parking (Williams-Brice)',                             150),
  ('mm',  'MM Parking (Baxley Hall)',                               150),
  ('nn',  'NN Parking (Gardens Residence Halls)',                   150),
  ('o',   'O Parking (Hampton and Laurel Hall)',                    150),
  ('oo',  'OO Parking',                                             150),
  ('p',   'P Parking (Edwards Building)',                           150),
  ('q',   'Q Parking (Edwards Building)',                           150),
  ('qq',  'QQ Parking (Brooks Stadium, Boni Belle Hitting Facility)', 150),
  ('r',   'R Parking (Brittain Hall)',                              150),
  ('rr',  'RR Parking (University Place)',                          150),
  ('s',   'S Parking (Brittain Hall)',                              150),
  ('uu',  'UU Parking (near Arcadia Hall)',                         150),
  ('ww',  'WW Parking (Sands Hall)',                                150),
  ('yy',  'YY Parking (close to University Place)',                 150),

  -- Extra: Chapel lot from your GeoJSON, so stats can exist for it too
  ('cp',  'Chapel Lot',                                             150)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      capacity = EXCLUDED.capacity;
