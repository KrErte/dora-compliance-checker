package com.dorachecker.service;

import com.dorachecker.model.AiSystemEntity;
import com.dorachecker.model.AiSystemRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AiSystemService {

  private final AiSystemRepository repository;

  public AiSystemService(AiSystemRepository repository) {
    this.repository = repository;
  }

  public Page<AiSystemEntity> listAiSystems(
      String userId,
      String search,
      String riskLevel,
      String status,
      String deploymentContext,
      int page,
      int size) {
    Specification<AiSystemEntity> spec =
        (root, query, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("userId"), userId));
          predicates.add(cb.equal(root.get("deleted"), false));

          if (search != null && !search.isBlank()) {
            String pattern = "%" + search.toLowerCase() + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("vendor")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern)));
          }
          if (riskLevel != null && !riskLevel.isBlank()) {
            predicates.add(cb.equal(root.get("riskLevel"), riskLevel));
          }
          if (status != null && !status.isBlank()) {
            predicates.add(cb.equal(root.get("status"), status));
          }
          if (deploymentContext != null && !deploymentContext.isBlank()) {
            predicates.add(cb.equal(root.get("deploymentContext"), deploymentContext));
          }
          return cb.and(predicates.toArray(new Predicate[0]));
        };

    return repository.findAll(
        spec, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
  }

  public Optional<AiSystemEntity> getAiSystem(String id, String userId) {
    return repository.findByIdAndUserIdAndDeletedFalse(id, userId);
  }

  @Transactional
  public AiSystemEntity createAiSystem(AiSystemEntity system) {
    return repository.save(system);
  }

  @Transactional
  public AiSystemEntity updateAiSystem(AiSystemEntity system) {
    return repository.save(system);
  }

  @Transactional
  public boolean deleteAiSystem(String id, String userId) {
    Optional<AiSystemEntity> opt = repository.findByIdAndUserIdAndDeletedFalse(id, userId);
    if (opt.isEmpty()) return false;
    AiSystemEntity system = opt.get();
    system.setDeleted(true);
    repository.save(system);
    return true;
  }

  public long countByUserId(String userId) {
    return repository.countByUserIdAndDeletedFalse(userId);
  }

  public Map<String, Long> getRiskDistribution(String userId) {
    List<Object[]> rows = repository.countByRiskLevelGrouped(userId);
    Map<String, Long> dist = new java.util.LinkedHashMap<>();
    for (Object[] row : rows) {
      dist.put((String) row[0], (Long) row[1]);
    }
    return dist;
  }
}
