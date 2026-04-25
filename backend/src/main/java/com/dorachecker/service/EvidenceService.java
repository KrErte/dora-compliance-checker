package com.dorachecker.service;

import com.dorachecker.model.EvidenceEntity;
import com.dorachecker.model.EvidenceRepository;
import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class EvidenceService {

  private static final Logger log = LoggerFactory.getLogger(EvidenceService.class);
  private static final String EVIDENCE_BASE_DIR = "/app/data/evidence";
  private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static final Set<String> ALLOWED_TYPES =
      Set.of(
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/png",
          "image/jpeg",
          "image/jpg");
  private static final int FREE_TIER_LIMIT = 10;

  // DORA articles relevant for evidence mapping
  private static final List<Integer> DORA_ARTICLES =
      List.of(
          6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
          29, 30, 45);

  private static final Map<String, String> PILLAR_NAMES =
      Map.of(
          "ICT_RISK_MANAGEMENT", "ICT Risk Management",
          "INCIDENT_MANAGEMENT", "Incident Management",
          "TESTING", "Digital Operational Resilience Testing",
          "THIRD_PARTY", "Third-Party Risk Management",
          "INFORMATION_SHARING", "Information Sharing");

  private final EvidenceRepository repository;
  private final SubscriptionGuardService subscriptionGuard;

  public EvidenceService(
      EvidenceRepository repository, SubscriptionGuardService subscriptionGuard) {
    this.repository = repository;
    this.subscriptionGuard = subscriptionGuard;
  }

  public EvidenceEntity upload(
      String userId,
      MultipartFile file,
      String title,
      String category,
      String pillar,
      String description,
      String expiryDate,
      String articleNumbers)
      throws IOException {
    // Validate file
    if (file.isEmpty()) {
      throw new IllegalArgumentException("File is empty");
    }
    if (file.getSize() > MAX_FILE_SIZE) {
      throw new IllegalArgumentException("File size exceeds 10MB limit");
    }
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
      throw new IllegalArgumentException(
          "File type not allowed. Accepted: PDF, DOCX, XLSX, PNG, JPG");
    }

    // Check FREE tier limit
    if (!subscriptionGuard.isPremium(userId, null)) {
      long count = repository.countByUserId(userId);
      if (count >= FREE_TIER_LIMIT) {
        throw new IllegalArgumentException(
            "FREE tier limit reached (max "
                + FREE_TIER_LIMIT
                + " documents). Upgrade to upload more.");
      }
    }

    // Store file to disk
    String storedFileName = UUID.randomUUID().toString() + getExtension(contentType);
    Path userDir = Paths.get(EVIDENCE_BASE_DIR, userId);
    Files.createDirectories(userDir);

    Path filePath = userDir.resolve(storedFileName).normalize();
    if (!filePath.startsWith(userDir)) {
      throw new IllegalArgumentException("Invalid file path");
    }

    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

    // Compute SHA-256 hash
    String fileHash = computeHash(filePath);

    // Create entity
    EvidenceEntity entity =
        new EvidenceEntity(
            userId, title, category, pillar, file.getOriginalFilename(), storedFileName);
    entity.setDescription(description);
    entity.setFileSize(file.getSize());
    entity.setMimeType(contentType);
    entity.setFileHash(fileHash);
    entity.setArticleNumbers(articleNumbers);
    if (expiryDate != null && !expiryDate.isBlank()) {
      entity.setExpiryDate(LocalDate.parse(expiryDate));
    }

    return repository.save(entity);
  }

  public List<EvidenceEntity> getByUser(String userId, String pillar, String status) {
    List<EvidenceEntity> items;
    if (pillar != null && !pillar.isBlank()) {
      items = repository.findByUserIdAndPillarOrderByCreatedAtDesc(userId, pillar);
    } else if (status != null && !status.isBlank()) {
      items = repository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    } else {
      items = repository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    // Lazy expiry check
    checkExpiry(items);
    return items;
  }

  public EvidenceEntity getById(String id, String userId) {
    return repository.findById(id).filter(e -> e.getUserId().equals(userId)).orElse(null);
  }

  public EvidenceEntity update(String id, String userId, Map<String, Object> body) {
    EvidenceEntity entity = getById(id, userId);
    if (entity == null) return null;

    if (body.containsKey("title")) entity.setTitle((String) body.get("title"));
    if (body.containsKey("description")) entity.setDescription((String) body.get("description"));
    if (body.containsKey("category")) entity.setCategory((String) body.get("category"));
    if (body.containsKey("pillar")) entity.setPillar((String) body.get("pillar"));
    if (body.containsKey("articleNumbers"))
      entity.setArticleNumbers((String) body.get("articleNumbers"));
    if (body.containsKey("notes")) entity.setNotes((String) body.get("notes"));
    if (body.containsKey("expiryDate")) {
      Object val = body.get("expiryDate");
      entity.setExpiryDate(val != null ? LocalDate.parse((String) val) : null);
    }

    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public void delete(String id, String userId) throws IOException {
    EvidenceEntity entity = getById(id, userId);
    if (entity == null) return;

    // Delete file from disk
    Path filePath = Paths.get(EVIDENCE_BASE_DIR, userId, entity.getStoredFileName());
    Files.deleteIfExists(filePath);

    repository.delete(entity);
  }

  public EvidenceEntity verify(String id, String userId, String verifiedBy) {
    EvidenceEntity entity = getById(id, userId);
    if (entity == null) return null;

    entity.setStatus("VERIFIED");
    entity.setVerifiedBy(verifiedBy);
    entity.setVerifiedAt(LocalDateTime.now());
    entity.setUpdatedAt(LocalDateTime.now());
    return repository.save(entity);
  }

  public EvidenceEntity uploadNewVersion(String id, String userId, MultipartFile file)
      throws IOException {
    EvidenceEntity existing = getById(id, userId);
    if (existing == null) return null;

    // Validate file
    if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
    if (file.getSize() > MAX_FILE_SIZE)
      throw new IllegalArgumentException("File size exceeds 10MB limit");
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
      throw new IllegalArgumentException("File type not allowed");
    }

    // Store new file
    String storedFileName = UUID.randomUUID().toString() + getExtension(contentType);
    Path userDir = Paths.get(EVIDENCE_BASE_DIR, userId);
    Files.createDirectories(userDir);
    Path filePath = userDir.resolve(storedFileName).normalize();
    if (!filePath.startsWith(userDir)) throw new IllegalArgumentException("Invalid file path");
    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

    // Delete old file
    Path oldPath = Paths.get(EVIDENCE_BASE_DIR, userId, existing.getStoredFileName());
    Files.deleteIfExists(oldPath);

    String fileHash = computeHash(filePath);

    // Update entity with new file info
    existing.setPreviousVersionId(existing.getId());
    existing.setVersion(existing.getVersion() + 1);
    existing.setFileName(file.getOriginalFilename());
    existing.setStoredFileName(storedFileName);
    existing.setFileSize(file.getSize());
    existing.setMimeType(contentType);
    existing.setFileHash(fileHash);
    existing.setStatus("PENDING"); // Reset status after new version
    existing.setVerifiedBy(null);
    existing.setVerifiedAt(null);
    existing.setUpdatedAt(LocalDateTime.now());

    return repository.save(existing);
  }

  public Path getFilePath(String id, String userId) {
    EvidenceEntity entity = getById(id, userId);
    if (entity == null) return null;

    Path filePath = Paths.get(EVIDENCE_BASE_DIR, userId, entity.getStoredFileName());
    if (!Files.exists(filePath)) return null;
    return filePath;
  }

  public Map<String, Object> getStats(String userId) {
    long total = repository.countByUserId(userId);
    long pending = repository.countByUserIdAndStatus(userId, "PENDING");
    long verified = repository.countByUserIdAndStatus(userId, "VERIFIED");
    long expired = repository.countByUserIdAndStatus(userId, "EXPIRED");

    return Map.of(
        "total", total,
        "pending", pending,
        "verified", verified,
        "expired", expired);
  }

  public Map<String, Object> getCoverage(String userId) {
    List<EvidenceEntity> items = repository.findByUserIdOrderByCreatedAtDesc(userId);

    Map<Integer, Long> articleCounts = new HashMap<>();
    for (int art : DORA_ARTICLES) {
      articleCounts.put(art, 0L);
    }

    for (EvidenceEntity item : items) {
      if (item.getArticleNumbers() != null && !item.getArticleNumbers().isBlank()) {
        for (String artStr : item.getArticleNumbers().split(",")) {
          try {
            int art = Integer.parseInt(artStr.trim());
            if (articleCounts.containsKey(art)) {
              articleCounts.put(art, articleCounts.get(art) + 1);
            }
          } catch (NumberFormatException ignored) {
          }
        }
      }
    }

    long covered = articleCounts.values().stream().filter(c -> c > 0).count();
    long totalArticles = DORA_ARTICLES.size();

    return Map.of(
        "articles", articleCounts,
        "covered", covered,
        "total", totalArticles,
        "percentage", totalArticles > 0 ? Math.round((double) covered / totalArticles * 100) : 0);
  }

  public byte[] exportZip(String userId) throws IOException {
    List<EvidenceEntity> items = repository.findByUserIdOrderByCreatedAtDesc(userId);

    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (ZipOutputStream zos = new ZipOutputStream(baos)) {
      // Build manifest CSV
      StringBuilder manifest = new StringBuilder();
      manifest.append(
          "Title,Category,Pillar,Status,Articles,FileName,Version,ExpiryDate,VerifiedBy,VerifiedAt\n");

      for (EvidenceEntity item : items) {
        String pillarName = PILLAR_NAMES.getOrDefault(item.getPillar(), item.getPillar());
        String articles = item.getArticleNumbers() != null ? item.getArticleNumbers() : "";

        // Add file to ZIP organized by pillar/article
        Path sourcePath = Paths.get(EVIDENCE_BASE_DIR, userId, item.getStoredFileName());
        if (Files.exists(sourcePath)) {
          // Create folder structure: PillarName/Art_N/filename
          String folderPath = pillarName + "/";
          if (!articles.isBlank()) {
            String firstArticle = articles.split(",")[0].trim();
            folderPath += "Art_" + firstArticle + "/";
          }
          String entryName = folderPath + item.getFileName();

          ZipEntry entry = new ZipEntry(entryName);
          zos.putNextEntry(entry);
          Files.copy(sourcePath, zos);
          zos.closeEntry();
        }

        // Add to manifest
        manifest.append(escapeCsv(item.getTitle())).append(",");
        manifest.append(escapeCsv(item.getCategory())).append(",");
        manifest.append(escapeCsv(pillarName)).append(",");
        manifest.append(escapeCsv(item.getStatus())).append(",");
        manifest.append(escapeCsv(articles)).append(",");
        manifest.append(escapeCsv(item.getFileName())).append(",");
        manifest.append(item.getVersion()).append(",");
        manifest
            .append(item.getExpiryDate() != null ? item.getExpiryDate().toString() : "")
            .append(",");
        manifest
            .append(item.getVerifiedBy() != null ? escapeCsv(item.getVerifiedBy()) : "")
            .append(",");
        manifest
            .append(item.getVerifiedAt() != null ? item.getVerifiedAt().toString() : "")
            .append("\n");
      }

      // Add manifest.csv
      ZipEntry manifestEntry = new ZipEntry("manifest.csv");
      zos.putNextEntry(manifestEntry);
      zos.write(manifest.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
      zos.closeEntry();
    }

    return baos.toByteArray();
  }

  public void deleteAllForUser(String userId) {
    // Delete all files from disk
    try {
      Path userDir = Paths.get(EVIDENCE_BASE_DIR, userId);
      if (Files.exists(userDir)) {
        try (var files = Files.walk(userDir)) {
          files
              .sorted(Comparator.reverseOrder())
              .forEach(
                  p -> {
                    try {
                      Files.deleteIfExists(p);
                    } catch (IOException ignored) {
                    }
                  });
        }
      }
    } catch (IOException e) {
      log.warn("Failed to delete evidence files for userId={}: {}", userId, e.getMessage());
    }

    // Delete DB records
    repository.deleteByUserId(userId);
  }

  private void checkExpiry(List<EvidenceEntity> items) {
    LocalDate today = LocalDate.now();
    for (EvidenceEntity item : items) {
      if ("VERIFIED".equals(item.getStatus())
          && item.getExpiryDate() != null
          && item.getExpiryDate().isBefore(today)) {
        item.setStatus("EXPIRED");
        item.setUpdatedAt(LocalDateTime.now());
        repository.save(item);
      }
    }
  }

  private String computeHash(Path filePath) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] fileBytes = Files.readAllBytes(filePath);
      byte[] hashBytes = digest.digest(fileBytes);
      StringBuilder sb = new StringBuilder();
      for (byte b : hashBytes) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (Exception e) {
      log.warn("Failed to compute file hash: {}", e.getMessage());
      return null;
    }
  }

  private String getExtension(String contentType) {
    return switch (contentType) {
      case "application/pdf" -> ".pdf";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
      case "image/png" -> ".png";
      case "image/jpeg", "image/jpg" -> ".jpg";
      default -> ".bin";
    };
  }

  private String escapeCsv(String value) {
    if (value == null) return "";
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }
}
