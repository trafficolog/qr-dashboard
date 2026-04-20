CREATE UNIQUE INDEX "tags_name_lower_unique_idx" ON "tags" USING btree (lower("name"));
