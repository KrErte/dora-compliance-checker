package com.dorachecker.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface WorkspaceProjectRepository extends JpaRepository<WorkspaceProjectEntity, String> {
    List<WorkspaceProjectEntity> findByCreatedByOrderByCreatedAtDesc(String createdBy);
    List<WorkspaceProjectEntity> findByTeamIdOrderByCreatedAtDesc(String teamId);
    List<WorkspaceProjectEntity> findByExpiresAtBefore(LocalDateTime dateTime);

    @Query("SELECT p FROM WorkspaceProjectEntity p WHERE p.createdBy = :email OR p.teamId IN " +
           "(SELECT r.project.teamId FROM WorkspaceReviewEntity r WHERE r.reviewerEmail = :email)")
    List<WorkspaceProjectEntity> findAccessibleProjects(String email);
}

@Repository
interface WorkspaceDocumentRepository extends JpaRepository<WorkspaceDocumentEntity, String> {
    List<WorkspaceDocumentEntity> findByProjectId(String projectId);
    List<WorkspaceDocumentEntity> findByAutoDeleteAtBefore(LocalDateTime dateTime);
}

@Repository
interface WorkspaceGapResultRepository extends JpaRepository<WorkspaceGapResultEntity, String> {
    List<WorkspaceGapResultEntity> findByProjectId(String projectId);
    List<WorkspaceGapResultEntity> findByProjectIdAndRegulation(String projectId, String regulation);
}

@Repository
interface WorkspaceReviewRepository extends JpaRepository<WorkspaceReviewEntity, String> {
    List<WorkspaceReviewEntity> findByProjectId(String projectId);
    List<WorkspaceReviewEntity> findByReviewerEmail(String email);
    WorkspaceReviewEntity findByProjectIdAndReviewerEmail(String projectId, String email);
}

@Repository
interface WorkspaceAuditLogRepository extends JpaRepository<WorkspaceAuditLogEntity, String> {
    List<WorkspaceAuditLogEntity> findByProjectIdOrderByTimestampDesc(String projectId);
}
