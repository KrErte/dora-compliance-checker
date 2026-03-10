package com.dorachecker.service.validation;

import java.util.List;

public interface RoiValidationRule {
    String getRuleId();
    String getSeverity(); // ERROR, WARNING, INFO
    String getTemplateCode();
    String getCategory(); // FORMAT, REQUIRED, FK_INTEGRITY, BUSINESS, CROSS_TEMPLATE, DATA_QUALITY, COMPLETENESS, DUPLICATE, AGGREGATION
    List<RoiViolation> evaluate(RoiValidationContext ctx);
}
