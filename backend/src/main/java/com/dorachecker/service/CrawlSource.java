package com.dorachecker.service;

import java.util.Map;

/** Common interface for all data crawlers/feed processors. */
public interface CrawlSource {

  /** Unique name for this crawler (e.g., "ict-providers", "company-profiles"). */
  String getName();

  /** Whether this crawler is enabled via configuration. */
  boolean isEnabled();

  /** Execute the crawl and return results. */
  Map<String, Object> execute();
}
