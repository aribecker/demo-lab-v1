package ariel.iteration2.weather.access;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

/** Owner-authorized, opt-in data change. Flyway records V2 even when disabled. */
public final class V2__Review_everyone_administration extends BaseJavaMigration {
    private final boolean enabled;
    public V2__Review_everyone_administration(boolean enabled) { this.enabled=enabled; }

    @Override public void migrate(Context context) throws Exception {
        if (!enabled) return;
        try (var statement=context.getConnection().prepareStatement("""
            INSERT INTO demo_lab.memberships(group_id,user_id)
            SELECT DISTINCT g.id,u.id
            FROM demo_lab.groups g
            JOIN demo_lab.group_permissions p ON p.group_id=g.id
            CROSS JOIN demo_lab.users u
            WHERE u.system_key='everyone'
              AND ((g.name='Users administration' AND p.permission='USERS')
                OR (g.name='Groups administration' AND p.permission='GROUPS'))
              AND NOT EXISTS (SELECT 1 FROM demo_lab.memberships m
                WHERE m.group_id=g.id AND m.user_id=u.id)
            """)) {
            statement.executeUpdate();
        }
    }
}
