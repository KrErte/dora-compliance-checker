package com.dorachecker.testsupport;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Table;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Truncates all JPA-managed tables between test methods. Faster than @Sql rollback and more
 * reliable than @DirtiesContext.
 */
@Component
public class DatabaseCleaner {

  /** Tables that hold static seed data — never truncated. */
  private static final Set<String> EXCLUDED =
      Set.of(
          "compliance_questions", // seeded at startup
          "compliance_domains", // seeded at startup
          "regulations" // seeded at startup
          );

  @PersistenceContext private EntityManager em;

  private List<String> tableNames;

  @Transactional
  public void clean() {
    if (tableNames == null) {
      tableNames =
          em.getMetamodel().getEntities().stream()
              .filter(e -> e.getJavaType().isAnnotationPresent(Table.class))
              .map(e -> e.getJavaType().getAnnotation(Table.class).name())
              .filter(name -> !name.isBlank() && !EXCLUDED.contains(name))
              .toList();
    }

    em.flush();
    em.createNativeQuery("SET CONSTRAINTS ALL DEFERRED").executeUpdate();
    for (String table : tableNames) {
      em.createNativeQuery("TRUNCATE TABLE \"" + table + "\" CASCADE").executeUpdate();
    }
  }
}
