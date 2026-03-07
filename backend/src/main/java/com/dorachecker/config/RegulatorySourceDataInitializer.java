package com.dorachecker.config;

import com.dorachecker.model.RegulatorySourceEntity;
import com.dorachecker.model.RegulatorySourceEntity.SourceCategory;
import com.dorachecker.model.RegulatorySourceEntity.SourceType;
import com.dorachecker.model.RegulatorySourceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RegulatorySourceDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RegulatorySourceDataInitializer.class);

    private final RegulatorySourceRepository repository;

    public RegulatorySourceDataInitializer(RegulatorySourceRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (repository.count() > 0) {
            log.info("RegulatorySourceDataInitializer: Sources already exist, skipping");
            return;
        }

        log.info("RegulatorySourceDataInitializer: Seeding regulatory sources...");

        repository.save(new RegulatorySourceEntity(
                "EUR-Lex DORA", SourceType.RSS,
                "https://eur-lex.europa.eu/EN/display-feed.html?rss=true&dates=ALL&type=Legislation",
                SourceCategory.EU));

        repository.save(new RegulatorySourceEntity(
                "EBA Guidelines & Reports", SourceType.RSS,
                "https://www.eba.europa.eu/rss/publications",
                SourceCategory.EBA));

        repository.save(new RegulatorySourceEntity(
                "EIOPA Guidelines", SourceType.RSS,
                "https://www.eiopa.europa.eu/rss_en",
                SourceCategory.EIOPA));

        repository.save(new RegulatorySourceEntity(
                "ESMA Publications", SourceType.RSS,
                "https://www.esma.europa.eu/rss/publications",
                SourceCategory.ESMA));

        repository.save(new RegulatorySourceEntity(
                "Finantsinspektsioon", SourceType.RSS,
                "https://www.fi.ee/et/rss",
                SourceCategory.FI_EE));

        repository.save(new RegulatorySourceEntity(
                "CERT-EE Advisories", SourceType.RSS,
                "https://www.cert.ee/rss",
                SourceCategory.CERT_EE));

        repository.save(new RegulatorySourceEntity(
                "Riigi Teataja", SourceType.RSS,
                "https://www.riigiteataja.ee/rss.html",
                SourceCategory.RIIGI_TEATAJA));

        log.info("RegulatorySourceDataInitializer: Seeded {} sources", repository.count());
    }
}
