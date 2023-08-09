INSERT INTO Users (name, password, weight, picture) VALUES ('Terry Fox', 'trackstar',
 NULL, 'https://cloudfront-us-east-1.images.arcpublishing.com/tgam/K3XHSZZ4VFJINOSOTHTMQ6STZU.jpg');

INSERT INTO Routes (user_id, coordinates, distance)
VALUES ((SELECT id FROM Users WHERE name='Terry Fox'), 
  ARRAY[
    (49.8951, 97.1384, true), 
    (53.5461, 113.4938, false), 
    (53.5444, 113.4909, true)
  ]::coordinate[],
 1234.5);

-- Insert a new workout
-- We'll fetch the ID of the route we just created in a similar way, and assume the workout covered the whole distance.
INSERT INTO Workouts (user_id, route_id, duration, distance, weight, calories_burned)
VALUES ((SELECT id FROM Users WHERE name='Terry Fox'),
  (SELECT min(id) FROM Routes WHERE user_id=(SELECT id FROM Users WHERE name='Terry Fox')),
  ARRAY[6,0], 
  (SELECT distance FROM Routes WHERE id=(SELECT min(id) FROM Routes WHERE user_id=(SELECT id FROM Users 
  WHERE name='Terry Fox'))), NULL, NULL);
