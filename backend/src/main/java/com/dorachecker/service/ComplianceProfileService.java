package com.dorachecker.service;

import com.dorachecker.model.ComplianceProfileEntity;
import com.dorachecker.model.ComplianceProfileEntity.AlertFrequency;
import com.dorachecker.model.ComplianceProfileEntity.CompanyType;
import com.dorachecker.model.ComplianceProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ComplianceProfileService {

    private final ComplianceProfileRepository repository;

    public ComplianceProfileService(ComplianceProfileRepository repository) {
        this.repository = repository;
    }

    public Optional<ComplianceProfileEntity> getProfile(String userId) {
        return repository.findByUserId(userId);
    }

    public boolean hasProfile(String userId) {
        return repository.existsByUserId(userId);
    }

    @Transactional
    public ComplianceProfileEntity createOrUpdate(String userId, CompanyType companyType, String country,
                                                   List<String> regulations, AlertFrequency alertFrequency,
                                                   boolean alertEmail, boolean alertDashboard) {
        ComplianceProfileEntity profile = repository.findByUserId(userId).orElse(null);
        if (profile == null) {
            profile = new ComplianceProfileEntity();
            profile.setUserId(userId);
            profile.setCreatedAt(LocalDateTime.now());
        }
        profile.setCompanyType(companyType);
        profile.setCountry(country != null ? country : "EST");
        profile.setRegulationsList(regulations);
        profile.setAlertFrequency(alertFrequency != null ? alertFrequency : AlertFrequency.WEEKLY);
        profile.setAlertEmail(alertEmail);
        profile.setAlertDashboard(alertDashboard);
        return repository.save(profile);
    }

    @Transactional
    public void deleteProfile(String userId) {
        repository.deleteByUserId(userId);
    }
}
