package com.dorachecker.service;

import com.dorachecker.model.*;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {

  private final OrganizationRepository orgRepository;
  private final OrganizationMemberRepository memberRepository;
  private final OrganizationInviteRepository inviteRepository;
  private final UserRepository userRepository;

  public OrganizationService(
      OrganizationRepository orgRepository,
      OrganizationMemberRepository memberRepository,
      OrganizationInviteRepository inviteRepository,
      UserRepository userRepository) {
    this.orgRepository = orgRepository;
    this.memberRepository = memberRepository;
    this.inviteRepository = inviteRepository;
    this.userRepository = userRepository;
  }

  @Transactional
  public OrganizationEntity create(String name, String description, String ownerId) {
    OrganizationEntity org = new OrganizationEntity(name, ownerId);
    org.setDescription(description);
    org = orgRepository.save(org);
    // Add owner as member with OWNER role
    OrganizationMemberEntity ownerMember =
        new OrganizationMemberEntity(org.getId(), ownerId, OrganizationMemberEntity.OrgRole.OWNER);
    memberRepository.save(ownerMember);
    return org;
  }

  public List<OrganizationEntity> getByUser(String userId) {
    List<OrganizationMemberEntity> memberships = memberRepository.findByUserId(userId);
    List<String> orgIds =
        memberships.stream().map(OrganizationMemberEntity::getOrganizationId).toList();
    return orgRepository.findAllById(orgIds);
  }

  public Optional<OrganizationEntity> getById(String orgId, String userId) {
    return orgRepository.findById(orgId).filter(org -> isMember(orgId, userId));
  }

  @Transactional
  public OrganizationEntity update(String orgId, String name, String description, String userId) {
    OrganizationEntity org =
        orgRepository
            .findById(orgId)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
    if (!isAdminOrOwner(orgId, userId)) throw new RuntimeException("Not authorized");
    org.setName(name);
    org.setDescription(description);
    return orgRepository.save(org);
  }

  @Transactional
  public void delete(String orgId, String userId) {
    OrganizationEntity org =
        orgRepository
            .findById(orgId)
            .orElseThrow(() -> new RuntimeException("Organization not found"));
    if (!org.getOwnerId().equals(userId)) throw new RuntimeException("Only owner can delete");
    memberRepository.findByOrganizationId(orgId).forEach(m -> memberRepository.delete(m));
    inviteRepository
        .findByOrganizationIdAndStatus(orgId, OrganizationInviteEntity.InviteStatus.PENDING)
        .forEach(i -> inviteRepository.delete(i));
    orgRepository.delete(org);
  }

  public List<Map<String, Object>> getMembers(String orgId, String userId) {
    if (!isMember(orgId, userId)) throw new RuntimeException("Not authorized");
    List<OrganizationMemberEntity> members = memberRepository.findByOrganizationId(orgId);
    List<Map<String, Object>> result = new ArrayList<>();
    for (OrganizationMemberEntity member : members) {
      Map<String, Object> m = new LinkedHashMap<>();
      m.put("id", member.getId());
      m.put("userId", member.getUserId());
      m.put("role", member.getRole().name());
      m.put("joinedAt", member.getJoinedAt());
      userRepository
          .findById(member.getUserId())
          .ifPresent(
              u -> {
                m.put("email", u.getEmail());
                m.put("fullName", u.getFullName());
              });
      result.add(m);
    }
    return result;
  }

  @Transactional
  public OrganizationInviteEntity invite(
      String orgId, String email, String role, String invitedByUserId) {
    if (!isAdminOrOwner(orgId, invitedByUserId)) throw new RuntimeException("Not authorized");
    OrganizationMemberEntity.OrgRole orgRole = OrganizationMemberEntity.OrgRole.valueOf(role);
    String token = UUID.randomUUID().toString();
    OrganizationInviteEntity invite =
        new OrganizationInviteEntity(orgId, email, invitedByUserId, orgRole, token);
    return inviteRepository.save(invite);
  }

  public List<OrganizationInviteEntity> getPendingInvites(String orgId, String userId) {
    if (!isAdminOrOwner(orgId, userId)) throw new RuntimeException("Not authorized");
    return inviteRepository.findByOrganizationIdAndStatus(
        orgId, OrganizationInviteEntity.InviteStatus.PENDING);
  }

  @Transactional
  public void acceptInvite(String token, String userId) {
    OrganizationInviteEntity invite =
        inviteRepository
            .findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invite not found"));
    if (invite.getStatus() != OrganizationInviteEntity.InviteStatus.PENDING)
      throw new RuntimeException("Invite is no longer valid");
    if (invite.getExpiresAt().isBefore(LocalDateTime.now())) {
      invite.setStatus(OrganizationInviteEntity.InviteStatus.EXPIRED);
      inviteRepository.save(invite);
      throw new RuntimeException("Invite has expired");
    }
    // Verify the accepting user's email matches the invite
    UserEntity user =
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    if (!user.getEmail().equalsIgnoreCase(invite.getEmail()))
      throw new RuntimeException("This invite was sent to a different email");

    // Add member
    OrganizationMemberEntity member =
        new OrganizationMemberEntity(invite.getOrganizationId(), userId, invite.getRole());
    memberRepository.save(member);

    invite.setStatus(OrganizationInviteEntity.InviteStatus.ACCEPTED);
    invite.setAcceptedAt(LocalDateTime.now());
    inviteRepository.save(invite);
  }

  @Transactional
  public void cancelInvite(String inviteId, String userId) {
    OrganizationInviteEntity invite =
        inviteRepository
            .findById(inviteId)
            .orElseThrow(() -> new RuntimeException("Invite not found"));
    if (!isAdminOrOwner(invite.getOrganizationId(), userId))
      throw new RuntimeException("Not authorized");
    invite.setStatus(OrganizationInviteEntity.InviteStatus.CANCELLED);
    inviteRepository.save(invite);
  }

  @Transactional
  public void updateMemberRole(String orgId, String memberId, String newRole, String userId) {
    if (!isAdminOrOwner(orgId, userId)) throw new RuntimeException("Not authorized");
    OrganizationMemberEntity member =
        memberRepository
            .findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
    if (!member.getOrganizationId().equals(orgId))
      throw new RuntimeException("Member not in organization");
    if (member.getRole() == OrganizationMemberEntity.OrgRole.OWNER)
      throw new RuntimeException("Cannot change owner role");
    member.setRole(OrganizationMemberEntity.OrgRole.valueOf(newRole));
    memberRepository.save(member);
  }

  @Transactional
  public void removeMember(String orgId, String memberId, String userId) {
    if (!isAdminOrOwner(orgId, userId)) throw new RuntimeException("Not authorized");
    OrganizationMemberEntity member =
        memberRepository
            .findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
    if (!member.getOrganizationId().equals(orgId))
      throw new RuntimeException("Member not in organization");
    if (member.getRole() == OrganizationMemberEntity.OrgRole.OWNER)
      throw new RuntimeException("Cannot remove owner");
    memberRepository.delete(member);
  }

  @Transactional
  public void leaveOrganization(String orgId, String userId) {
    OrganizationMemberEntity member =
        memberRepository
            .findByOrganizationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new RuntimeException("Not a member"));
    if (member.getRole() == OrganizationMemberEntity.OrgRole.OWNER)
      throw new RuntimeException(
          "Owner cannot leave. Transfer ownership or delete the organization.");
    memberRepository.delete(member);
  }

  public List<OrganizationInviteEntity> getMyPendingInvites(String userId) {
    UserEntity user =
        userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
    return inviteRepository.findByEmailAndStatus(
        user.getEmail(), OrganizationInviteEntity.InviteStatus.PENDING);
  }

  private boolean isMember(String orgId, String userId) {
    return memberRepository.findByOrganizationIdAndUserId(orgId, userId).isPresent();
  }

  private boolean isAdminOrOwner(String orgId, String userId) {
    return memberRepository
        .findByOrganizationIdAndUserId(orgId, userId)
        .map(
            m ->
                m.getRole() == OrganizationMemberEntity.OrgRole.OWNER
                    || m.getRole() == OrganizationMemberEntity.OrgRole.ADMIN)
        .orElse(false);
  }
}
