package com.dorachecker.controller;

import com.dorachecker.model.PromoSlotEntity;
import com.dorachecker.model.PromoSlotRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/promo")
@CrossOrigin
public class PromoController {

    private final PromoSlotRepository promoSlotRepository;

    @Value("${promo.slots.taken:5}")
    private int defaultTaken;

    @Value("${promo.slots.total:10}")
    private int defaultTotal;

    public PromoController(PromoSlotRepository promoSlotRepository) {
        this.promoSlotRepository = promoSlotRepository;
    }

    @GetMapping("/slots")
    public ResponseEntity<Map<String, Object>> getSlots() {
        PromoSlotEntity promoSlot = promoSlotRepository.findById("early_adopter")
                .orElse(null);

        int taken = promoSlot != null ? promoSlot.getTaken() : defaultTaken;
        int total = promoSlot != null ? promoSlot.getTotal() : defaultTotal;

        Map<String, Object> response = new HashMap<>();
        response.put("taken", taken);
        response.put("total", total);

        return ResponseEntity.ok(response);
    }
}
