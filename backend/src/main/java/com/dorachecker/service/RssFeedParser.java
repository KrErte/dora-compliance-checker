package com.dorachecker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.*;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class RssFeedParser {

    private static final Logger log = LoggerFactory.getLogger(RssFeedParser.class);

    private static final DateTimeFormatter[] DATE_FORMATS = {
            DateTimeFormatter.RFC_1123_DATE_TIME,
            DateTimeFormatter.ISO_OFFSET_DATE_TIME,
            DateTimeFormatter.ISO_DATE_TIME,
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
    };

    public record FeedItem(String title, String link, String description, String pubDate, String guid) {}

    public List<FeedItem> parseFeed(String xmlContent) {
        List<FeedItem> items = new ArrayList<>();
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setNamespaceAware(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xmlContent)));
            doc.getDocumentElement().normalize();

            // Try RSS 2.0 format (<item>)
            NodeList rssItems = doc.getElementsByTagName("item");
            if (rssItems.getLength() > 0) {
                for (int i = 0; i < rssItems.getLength(); i++) {
                    Element el = (Element) rssItems.item(i);
                    items.add(parseRssItem(el));
                }
                return items;
            }

            // Try Atom format (<entry>)
            NodeList atomEntries = doc.getElementsByTagName("entry");
            for (int i = 0; i < atomEntries.getLength(); i++) {
                Element el = (Element) atomEntries.item(i);
                items.add(parseAtomEntry(el));
            }
        } catch (Exception e) {
            log.error("RSS/Atom parsimine ebaõnnestus: {}", e.getMessage());
        }
        return items;
    }

    private FeedItem parseRssItem(Element el) {
        String title = getTagValue(el, "title");
        String link = getTagValue(el, "link");
        String description = getTagValue(el, "description");
        String pubDate = getTagValue(el, "pubDate");
        String guid = getTagValue(el, "guid");
        if (guid == null || guid.isBlank()) {
            guid = link;
        }
        return new FeedItem(title, link, stripHtml(description), pubDate, guid);
    }

    private FeedItem parseAtomEntry(Element el) {
        String title = getTagValue(el, "title");
        String link = getAtomLink(el);
        String description = getTagValue(el, "summary");
        if (description == null || description.isBlank()) {
            description = getTagValue(el, "content");
        }
        String pubDate = getTagValue(el, "updated");
        if (pubDate == null || pubDate.isBlank()) {
            pubDate = getTagValue(el, "published");
        }
        String guid = getTagValue(el, "id");
        if (guid == null || guid.isBlank()) {
            guid = link;
        }
        return new FeedItem(title, link, stripHtml(description), pubDate, guid);
    }

    private String getAtomLink(Element el) {
        NodeList links = el.getElementsByTagName("link");
        for (int i = 0; i < links.getLength(); i++) {
            Element linkEl = (Element) links.item(i);
            String rel = linkEl.getAttribute("rel");
            if (rel.isEmpty() || "alternate".equals(rel)) {
                String href = linkEl.getAttribute("href");
                if (href != null && !href.isBlank()) return href;
            }
        }
        if (links.getLength() > 0) {
            return ((Element) links.item(0)).getAttribute("href");
        }
        return null;
    }

    private String getTagValue(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        if (nodes.getLength() == 0) return null;
        Node node = nodes.item(0);
        if (node == null) return null;
        String text = node.getTextContent();
        return text != null ? text.trim() : null;
    }

    private String stripHtml(String html) {
        if (html == null) return null;
        return html.replaceAll("<[^>]+>", "").replaceAll("\\s+", " ").trim();
    }

    public static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        dateStr = dateStr.trim();

        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try {
                ZonedDateTime zdt = ZonedDateTime.parse(dateStr, fmt);
                return zdt.toLocalDate();
            } catch (DateTimeParseException ignored) {}
        }

        // Try plain LocalDate
        try {
            return LocalDate.parse(dateStr.substring(0, Math.min(10, dateStr.length())));
        } catch (Exception ignored) {}

        return null;
    }
}
