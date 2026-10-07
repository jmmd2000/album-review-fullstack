-- Runs once, when the dev Postgres container first starts on an empty volume.
-- POSTGRES_DB creates albums_dev, and this adds the databases the tests use.
CREATE DATABASE albums_test;
CREATE DATABASE albums_test_e2e;
