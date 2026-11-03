import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const trafficEventsV2=sqliteTable('traffic_events_v2',{
 id:text('id').primaryKey(),occurredAt:text('occurred_at').notNull(),dayTbilisi:text('day_tbilisi').notNull(),
 visitor:text('visitor').notNull(),path:text('path').notNull(),source:text('source').notNull(),
 activeSeconds:integer('active_seconds').notNull().default(0),isTest:integer('is_test').notNull().default(0),schemaVersion:integer('schema_version').notNull().default(2)
},t=>[index('traffic_events_v2_day_idx').on(t.dayTbilisi)]);
