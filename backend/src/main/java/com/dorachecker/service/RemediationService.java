package com.dorachecker.service;

import com.dorachecker.model.RemediationItemEntity;
import com.dorachecker.model.RemediationItemRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class RemediationService {

    private final RemediationItemRepository repository;

    public RemediationService(RemediationItemRepository repository) {
        this.repository = repository;
    }

    public RemediationItemEntity create(String userId, Map<String, Object> body) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String source = (String) body.getOrDefault("source", "MANUAL");
        String sourceId = (String) body.get("sourceId");
        String pillar = (String) body.getOrDefault("pillar", "ICT_RISK_MANAGEMENT");
        String articleReference = (String) body.get("articleReference");
        String priority = (String) body.getOrDefault("priority", "MEDIUM");

        RemediationItemEntity entity = new RemediationItemEntity(userId, title, description,
            source, sourceId, pillar, articleReference, priority);

        if (body.containsKey("assignee")) entity.setAssignee((String) body.get("assignee"));
        if (body.containsKey("dueDate")) entity.setDueDate(LocalDate.parse((String) body.get("dueDate")));

        return repository.save(entity);
    }

    public List<RemediationItemEntity> getByUser(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public RemediationItemEntity getById(String id, String userId) {
        return repository.findById(id)
            .filter(e -> e.getUserId().equals(userId))
            .orElse(null);
    }

    public RemediationItemEntity update(String id, String userId, Map<String, Object> body) {
        RemediationItemEntity entity = getById(id, userId);
        if (entity == null) return null;

        if (body.containsKey("title")) entity.setTitle((String) body.get("title"));
        if (body.containsKey("description")) entity.setDescription((String) body.get("description"));
        if (body.containsKey("priority")) entity.setPriority((String) body.get("priority"));
        if (body.containsKey("status")) {
            String newStatus = (String) body.get("status");
            entity.setStatus(newStatus);
            if ("COMPLETED".equals(newStatus)) {
                entity.setCompletedDate(LocalDate.now());
            }
        }
        if (body.containsKey("assignee")) entity.setAssignee((String) body.get("assignee"));
        if (body.containsKey("dueDate")) entity.setDueDate(body.get("dueDate") != null ? LocalDate.parse((String) body.get("dueDate")) : null);
        if (body.containsKey("notes")) entity.setNotes((String) body.get("notes"));
        if (body.containsKey("pillar")) entity.setPillar((String) body.get("pillar"));
        if (body.containsKey("articleReference")) entity.setArticleReference((String) body.get("articleReference"));

        entity.setUpdatedAt(LocalDateTime.now());
        return repository.save(entity);
    }

    public void delete(String id, String userId) {
        RemediationItemEntity entity = getById(id, userId);
        if (entity != null) repository.delete(entity);
    }

    public Map<String, Object> getStats(String userId) {
        long total = repository.countByUserId(userId);
        long open = repository.countByUserIdAndStatus(userId, "OPEN");
        long inProgress = repository.countByUserIdAndStatus(userId, "IN_PROGRESS");
        long completed = repository.countByUserIdAndStatus(userId, "COMPLETED");
        long deferred = repository.countByUserIdAndStatus(userId, "DEFERRED");

        return Map.of(
            "total", total,
            "open", open,
            "inProgress", inProgress,
            "completed", completed,
            "deferred", deferred
        );
    }
}
