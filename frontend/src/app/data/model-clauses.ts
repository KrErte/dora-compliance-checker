// DORA Article 30 Model Contract Clauses
// Multi-language: ET, EN, DE, FR, NL, PL, ES, IT

export type ClauseLanguage = 'et' | 'en' | 'de' | 'fr' | 'nl' | 'pl' | 'es' | 'it';

export interface ClauseTranslation {
  name: string;
  clause: string;
}

export interface ModelClause {
  id: string;
  nameEt: string;
  nameEn: string;
  clauseEt: string;
  clauseEn: string;
  doraReference: string;
  translations: Record<ClauseLanguage, ClauseTranslation>;
}

export const CLAUSE_LANGUAGES: { code: ClauseLanguage; label: string; flag: string }[] = [
  { code: 'et', label: 'Eesti', flag: '🇪🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

export const MODEL_CLAUSES: ModelClause[] = [
  {
    id: '1',
    nameEt: 'Teenustaseme kokkulepped',
    nameEn: 'Service Level Agreements',
    clauseEt: '"Teenusepakkuja tagab teenuse kättesaadavuse vähemalt 99,5% tasemega kvartalis, mõõdetuna [monitooringusüsteemi] abil. Teenustaseme languse korral rakendatakse [X]% lepingutasu vähendamist."',
    clauseEn: '"The provider shall ensure service availability of at least 99.5% per quarter, measured by [monitoring system]. Service level degradation shall result in [X]% fee reduction."',
    doraReference: 'Art. 30(2)(a)',
    translations: {
      et: { name: 'Teenustaseme kokkulepped', clause: '"Teenusepakkuja tagab teenuse kättesaadavuse vähemalt 99,5% tasemega kvartalis, mõõdetuna [monitooringusüsteemi] abil. Teenustaseme languse korral rakendatakse [X]% lepingutasu vähendamist."' },
      en: { name: 'Service Level Agreements', clause: '"The provider shall ensure service availability of at least 99.5% per quarter, measured by [monitoring system]. Service level degradation shall result in [X]% fee reduction."' },
      de: { name: 'Service-Level-Vereinbarungen', clause: '"Der Dienstleister gewährleistet eine Dienstverfügbarkeit von mindestens 99,5 % pro Quartal, gemessen durch [Überwachungssystem]. Bei Unterschreitung des vereinbarten Service-Levels erfolgt eine Reduzierung der Vergütung um [X] %."' },
      fr: { name: 'Accords de niveau de service', clause: '"Le prestataire garantit une disponibilité du service d\'au moins 99,5 % par trimestre, mesurée par [système de surveillance]. Toute dégradation du niveau de service entraînera une réduction de [X] % des frais contractuels."' },
      nl: { name: 'Service Level Overeenkomsten', clause: '"De dienstverlener garandeert een beschikbaarheid van de dienst van ten minste 99,5% per kwartaal, gemeten met [monitoringsysteem]. Bij verlaging van het serviceniveau wordt een korting van [X]% op de vergoeding toegepast."' },
      pl: { name: 'Umowy o poziomie usług', clause: '"Dostawca zapewnia dostępność usługi na poziomie co najmniej 99,5% w każdym kwartale, mierzoną za pomocą [systemu monitoringu]. Obniżenie poziomu usług skutkuje obniżeniem opłaty o [X]%."' },
      es: { name: 'Acuerdos de nivel de servicio', clause: '"El proveedor garantizará una disponibilidad del servicio de al menos el 99,5% por trimestre, medida mediante [sistema de monitorización]. La degradación del nivel de servicio resultará en una reducción del [X]% de la tarifa contractual."' },
      it: { name: 'Accordi sul livello di servizio', clause: '"Il fornitore garantisce una disponibilità del servizio di almeno il 99,5% per trimestre, misurata tramite [sistema di monitoraggio]. Il deterioramento del livello di servizio comporterà una riduzione del [X]% del compenso contrattuale."' },
    }
  },
  {
    id: '2',
    nameEt: 'Intsidentidest teavitamine',
    nameEn: 'Incident Notification',
    clauseEt: '"Teenusepakkuja teavitab tellijat kõigist IKT-intsidentidest viivitamatult, kuid mitte hiljem kui [4] tundi pärast intsidendi tuvastamist. Teavitus sisaldab mõjuanalüüsi, prognoosi ja parandusmeetmeid."',
    clauseEn: '"The provider shall notify the client of all ICT incidents without delay, no later than [4] hours after detection. Notification shall include impact analysis, prognosis and remediation measures."',
    doraReference: 'Art. 30(2)(d)',
    translations: {
      et: { name: 'Intsidentidest teavitamine', clause: '"Teenusepakkuja teavitab tellijat kõigist IKT-intsidentidest viivitamatult, kuid mitte hiljem kui [4] tundi pärast intsidendi tuvastamist. Teavitus sisaldab mõjuanalüüsi, prognoosi ja parandusmeetmeid."' },
      en: { name: 'Incident Notification', clause: '"The provider shall notify the client of all ICT incidents without delay, no later than [4] hours after detection. Notification shall include impact analysis, prognosis and remediation measures."' },
      de: { name: 'Meldung von Vorfällen', clause: '"Der Dienstleister informiert den Auftraggeber unverzüglich, spätestens jedoch [4] Stunden nach Erkennung, über alle IKT-Vorfälle. Die Meldung umfasst eine Auswirkungsanalyse, Prognose und Abhilfemaßnahmen."' },
      fr: { name: 'Notification des incidents', clause: '"Le prestataire notifie le client de tout incident TIC sans délai, au plus tard [4] heures après sa détection. La notification comprend une analyse d\'impact, un pronostic et les mesures correctives."' },
      nl: { name: 'Incidentmelding', clause: '"De dienstverlener meldt alle ICT-incidenten onverwijld aan de opdrachtgever, uiterlijk [4] uur na detectie. De melding omvat een impactanalyse, prognose en herstelmaatregelen."' },
      pl: { name: 'Zgłaszanie incydentów', clause: '"Dostawca niezwłocznie, nie później niż w ciągu [4] godzin od wykrycia, powiadamia zleceniodawcę o wszystkich incydentach ICT. Powiadomienie zawiera analizę wpływu, prognozę oraz środki naprawcze."' },
      es: { name: 'Notificación de incidentes', clause: '"El proveedor notificará al cliente todos los incidentes TIC sin demora, a más tardar [4] horas después de su detección. La notificación incluirá análisis de impacto, pronóstico y medidas correctivas."' },
      it: { name: 'Notifica degli incidenti', clause: '"Il fornitore notifica al cliente tutti gli incidenti ICT senza ritardo, entro [4] ore dal rilevamento. La notifica include un\'analisi dell\'impatto, una prognosi e le misure correttive."' },
    }
  },
  {
    id: '3',
    nameEt: 'Auditeerimisõigus',
    nameEn: 'Audit Rights',
    clauseEt: '"Tellijal on õigus teostada teenusepakkuja süsteemides auditit vähemalt [1] kord aastas, kaasates sõltumatuid audiitoreid. Teenusepakkuja tagab auditi läbiviimiseks vajaliku ligipääsu ja dokumentatsiooni."',
    clauseEn: '"The client shall have the right to audit the provider systems at least [1] time per year, involving independent auditors. The provider shall ensure access and documentation necessary for the audit."',
    doraReference: 'Art. 30(2)(c)',
    translations: {
      et: { name: 'Auditeerimisõigus', clause: '"Tellijal on õigus teostada teenusepakkuja süsteemides auditit vähemalt [1] kord aastas, kaasates sõltumatuid audiitoreid. Teenusepakkuja tagab auditi läbiviimiseks vajaliku ligipääsu ja dokumentatsiooni."' },
      en: { name: 'Audit Rights', clause: '"The client shall have the right to audit the provider systems at least [1] time per year, involving independent auditors. The provider shall ensure access and documentation necessary for the audit."' },
      de: { name: 'Prüfungsrechte', clause: '"Der Auftraggeber hat das Recht, die Systeme des Dienstleisters mindestens [1] Mal jährlich zu prüfen, unter Einbeziehung unabhängiger Prüfer. Der Dienstleister gewährleistet den für die Prüfung erforderlichen Zugang und die erforderliche Dokumentation."' },
      fr: { name: 'Droits d\'audit', clause: '"Le client a le droit d\'auditer les systèmes du prestataire au moins [1] fois par an, en faisant appel à des auditeurs indépendants. Le prestataire garantit l\'accès et la documentation nécessaires à la réalisation de l\'audit."' },
      nl: { name: 'Auditrechten', clause: '"De opdrachtgever heeft het recht de systemen van de dienstverlener ten minste [1] keer per jaar te auditen, met inschakeling van onafhankelijke auditors. De dienstverlener waarborgt de voor de audit benodigde toegang en documentatie."' },
      pl: { name: 'Prawo do audytu', clause: '"Zleceniodawca ma prawo do przeprowadzania audytu systemów dostawcy co najmniej [1] raz w roku, z udziałem niezależnych audytorów. Dostawca zapewnia dostęp i dokumentację niezbędną do przeprowadzenia audytu."' },
      es: { name: 'Derechos de auditoría', clause: '"El cliente tendrá derecho a auditar los sistemas del proveedor al menos [1] vez al año, con la participación de auditores independientes. El proveedor garantizará el acceso y la documentación necesarios para la auditoría."' },
      it: { name: 'Diritti di audit', clause: '"Il cliente ha il diritto di effettuare audit sui sistemi del fornitore almeno [1] volta all\'anno, coinvolgendo revisori indipendenti. Il fornitore garantisce l\'accesso e la documentazione necessari per l\'audit."' },
    }
  },
  {
    id: '4',
    nameEt: 'Väljumisstrateegia',
    nameEn: 'Exit Strategy',
    clauseEt: '"Lepingu lõppemisel või ülesütlemisel tagab teenusepakkuja andmete ja protsesside üleandmise [90] kalendripäeva jooksul. Üleandmise plaan sisaldab andmeformaate, migratsiooni ajakava ja vastutavaid isikuid."',
    clauseEn: '"Upon termination, the provider shall ensure data and process handover within [90] calendar days. The transition plan shall include data formats, migration schedule and responsible persons."',
    doraReference: 'Art. 30(2)(e)',
    translations: {
      et: { name: 'Väljumisstrateegia', clause: '"Lepingu lõppemisel või ülesütlemisel tagab teenusepakkuja andmete ja protsesside üleandmise [90] kalendripäeva jooksul. Üleandmise plaan sisaldab andmeformaate, migratsiooni ajakava ja vastutavaid isikuid."' },
      en: { name: 'Exit Strategy', clause: '"Upon termination, the provider shall ensure data and process handover within [90] calendar days. The transition plan shall include data formats, migration schedule and responsible persons."' },
      de: { name: 'Ausstiegsstrategie', clause: '"Bei Beendigung des Vertrags gewährleistet der Dienstleister die Übergabe von Daten und Prozessen innerhalb von [90] Kalendertagen. Der Übergangsplan umfasst Datenformate, Migrationsplan und verantwortliche Personen."' },
      fr: { name: 'Stratégie de sortie', clause: '"À la résiliation du contrat, le prestataire assure le transfert des données et des processus dans un délai de [90] jours calendaires. Le plan de transition comprend les formats de données, le calendrier de migration et les personnes responsables."' },
      nl: { name: 'Exitstrategie', clause: '"Bij beëindiging van de overeenkomst draagt de dienstverlener binnen [90] kalenderdagen alle gegevens en processen over. Het overdrachtsplan omvat gegevensformaten, migratieplanning en verantwoordelijke personen."' },
      pl: { name: 'Strategia wyjścia', clause: '"Po rozwiązaniu umowy dostawca zapewnia przekazanie danych i procesów w ciągu [90] dni kalendarzowych. Plan przejścia obejmuje formaty danych, harmonogram migracji oraz osoby odpowiedzialne."' },
      es: { name: 'Estrategia de salida', clause: '"A la terminación del contrato, el proveedor garantizará la transferencia de datos y procesos en un plazo de [90] días naturales. El plan de transición incluirá formatos de datos, calendario de migración y personas responsables."' },
      it: { name: 'Strategia di uscita', clause: '"Alla risoluzione del contratto, il fornitore garantisce il trasferimento di dati e processi entro [90] giorni di calendario. Il piano di transizione comprende i formati dei dati, il calendario di migrazione e le persone responsabili."' },
    }
  },
  {
    id: '5',
    nameEt: 'Andmete asukoht ja töötlemine',
    nameEn: 'Data Location and Processing',
    clauseEt: '"Teenusepakkuja töötleb tellija andmeid ainult Euroopa Liidu/EMP piires. Allhankijate kaasamiseks on vajalik tellija eelnev kirjalik nõusolek. Andmete turvameetmed vastavad ISO 27001 standardile."',
    clauseEn: '"The provider shall process client data only within the EU/EEA. Subcontracting requires prior written consent. Data security measures shall comply with ISO 27001 standard."',
    doraReference: 'Art. 30(2)(b)',
    translations: {
      et: { name: 'Andmete asukoht ja töötlemine', clause: '"Teenusepakkuja töötleb tellija andmeid ainult Euroopa Liidu/EMP piires. Allhankijate kaasamiseks on vajalik tellija eelnev kirjalik nõusolek. Andmete turvameetmed vastavad ISO 27001 standardile."' },
      en: { name: 'Data Location and Processing', clause: '"The provider shall process client data only within the EU/EEA. Subcontracting requires prior written consent. Data security measures shall comply with ISO 27001 standard."' },
      de: { name: 'Datenspeicherort und -verarbeitung', clause: '"Der Dienstleister verarbeitet Kundendaten ausschließlich innerhalb der EU/des EWR. Die Einschaltung von Unterauftragnehmern bedarf der vorherigen schriftlichen Zustimmung. Die Datensicherheitsmaßnahmen entsprechen der Norm ISO 27001."' },
      fr: { name: 'Localisation et traitement des données', clause: '"Le prestataire traite les données du client exclusivement au sein de l\'UE/EEE. Le recours à des sous-traitants nécessite le consentement écrit préalable. Les mesures de sécurité des données sont conformes à la norme ISO 27001."' },
      nl: { name: 'Datalocatie en -verwerking', clause: '"De dienstverlener verwerkt klantgegevens uitsluitend binnen de EU/EER. Onderaanneming vereist voorafgaande schriftelijke toestemming. Databeveiligingsmaatregelen voldoen aan de ISO 27001-norm."' },
      pl: { name: 'Lokalizacja i przetwarzanie danych', clause: '"Dostawca przetwarza dane klienta wyłącznie na terenie UE/EOG. Podwykonawstwo wymaga uprzedniej pisemnej zgody. Środki bezpieczeństwa danych są zgodne z normą ISO 27001."' },
      es: { name: 'Ubicación y tratamiento de datos', clause: '"El proveedor tratará los datos del cliente exclusivamente dentro de la UE/EEE. La subcontratación requiere consentimiento previo por escrito. Las medidas de seguridad de datos cumplirán con la norma ISO 27001."' },
      it: { name: 'Localizzazione e trattamento dei dati', clause: '"Il fornitore tratta i dati del cliente esclusivamente all\'interno dell\'UE/SEE. Il subappalto richiede il previo consenso scritto. Le misure di sicurezza dei dati sono conformi alla norma ISO 27001."' },
    }
  },
  {
    id: '6',
    nameEt: 'Alltöövõtjate tingimused',
    nameEn: 'Subcontracting Conditions',
    clauseEt: '"Teenusepakkuja ei kaasa allhankijaid ilma tellija eelneva kirjaliku nõusolekuta. Allhankijate nimekiri ja nende IKT-riskiprofiil esitatakse tellijale enne lepingu sõlmimist ning iga muudatuse korral."',
    clauseEn: '"The provider shall not engage subcontractors without prior written consent. The list of subcontractors and their ICT risk profiles shall be provided before contract signing and upon any changes."',
    doraReference: 'Art. 30(2)(f)',
    translations: {
      et: { name: 'Alltöövõtjate tingimused', clause: '"Teenusepakkuja ei kaasa allhankijaid ilma tellija eelneva kirjaliku nõusolekuta. Allhankijate nimekiri ja nende IKT-riskiprofiil esitatakse tellijale enne lepingu sõlmimist ning iga muudatuse korral."' },
      en: { name: 'Subcontracting Conditions', clause: '"The provider shall not engage subcontractors without prior written consent. The list of subcontractors and their ICT risk profiles shall be provided before contract signing and upon any changes."' },
      de: { name: 'Unterauftragsbedingungen', clause: '"Der Dienstleister darf ohne vorherige schriftliche Zustimmung keine Unterauftragnehmer einschalten. Die Liste der Unterauftragnehmer und deren IKT-Risikoprofile sind vor Vertragsschluss und bei jeder Änderung vorzulegen."' },
      fr: { name: 'Conditions de sous-traitance', clause: '"Le prestataire ne peut faire appel à des sous-traitants sans le consentement écrit préalable. La liste des sous-traitants et leurs profils de risque TIC sont fournis avant la signature du contrat et à chaque modification."' },
      nl: { name: 'Voorwaarden voor onderaanneming', clause: '"De dienstverlener schakelt geen onderaannemers in zonder voorafgaande schriftelijke toestemming. De lijst van onderaannemers en hun ICT-risicoprofielen worden voor contractondertekening en bij elke wijziging verstrekt."' },
      pl: { name: 'Warunki podwykonawstwa', clause: '"Dostawca nie angażuje podwykonawców bez uprzedniej pisemnej zgody. Lista podwykonawców i ich profile ryzyka ICT są przedstawiane przed podpisaniem umowy oraz przy każdej zmianie."' },
      es: { name: 'Condiciones de subcontratación', clause: '"El proveedor no subcontratará sin consentimiento previo por escrito. La lista de subcontratistas y sus perfiles de riesgo TIC se proporcionarán antes de la firma del contrato y ante cualquier cambio."' },
      it: { name: 'Condizioni di subappalto', clause: '"Il fornitore non potrà avvalersi di subappaltatori senza il previo consenso scritto. L\'elenco dei subappaltatori e i relativi profili di rischio ICT saranno forniti prima della firma del contratto e ad ogni modifica."' },
    }
  },
  {
    id: '7',
    nameEt: 'IKT riskihaldus',
    nameEn: 'ICT Risk Management',
    clauseEt: '"Teenusepakkuja hoiab ajakohasena IKT riskihalduse raamistikku, mis hõlmab riskide tuvastamist, hindamist ja maandamist. Riskianalüüsi tulemused ja maandamismeetmed esitatakse tellijale kord kvartalis."',
    clauseEn: '"The provider shall maintain an up-to-date ICT risk management framework covering risk identification, assessment and mitigation. Risk analysis results and mitigation measures shall be reported to the client quarterly."',
    doraReference: 'Art. 30(2)(g)',
    translations: {
      et: { name: 'IKT riskihaldus', clause: '"Teenusepakkuja hoiab ajakohasena IKT riskihalduse raamistikku, mis hõlmab riskide tuvastamist, hindamist ja maandamist. Riskianalüüsi tulemused ja maandamismeetmed esitatakse tellijale kord kvartalis."' },
      en: { name: 'ICT Risk Management', clause: '"The provider shall maintain an up-to-date ICT risk management framework covering risk identification, assessment and mitigation. Risk analysis results and mitigation measures shall be reported to the client quarterly."' },
      de: { name: 'IKT-Risikomanagement', clause: '"Der Dienstleister pflegt ein aktuelles IKT-Risikomanagement-Rahmenwerk, das Risikoerkennung, -bewertung und -minderung umfasst. Risikoanalyseergebnisse und Minderungsmaßnahmen werden dem Auftraggeber vierteljährlich berichtet."' },
      fr: { name: 'Gestion des risques TIC', clause: '"Le prestataire maintient un cadre de gestion des risques TIC à jour couvrant l\'identification, l\'évaluation et l\'atténuation des risques. Les résultats de l\'analyse des risques et les mesures d\'atténuation sont communiqués au client chaque trimestre."' },
      nl: { name: 'ICT-risicobeheer', clause: '"De dienstverlener onderhoudt een actueel ICT-risicobeheerkader dat risico-identificatie, -beoordeling en -mitigatie omvat. Risicoanalyseresultaten en mitigatiemaatregelen worden elk kwartaal aan de opdrachtgever gerapporteerd."' },
      pl: { name: 'Zarządzanie ryzykiem ICT', clause: '"Dostawca utrzymuje aktualny system zarządzania ryzykiem ICT obejmujący identyfikację, ocenę i mitygację ryzyka. Wyniki analizy ryzyka i środki mitygacyjne są raportowane zleceniodawcy co kwartał."' },
      es: { name: 'Gestión de riesgos TIC', clause: '"El proveedor mantendrá un marco actualizado de gestión de riesgos TIC que cubra la identificación, evaluación y mitigación de riesgos. Los resultados del análisis de riesgos y las medidas de mitigación se comunicarán al cliente trimestralmente."' },
      it: { name: 'Gestione del rischio ICT', clause: '"Il fornitore mantiene un quadro aggiornato di gestione del rischio ICT che comprende identificazione, valutazione e mitigazione dei rischi. I risultati dell\'analisi dei rischi e le misure di mitigazione sono comunicati al cliente con cadenza trimestrale."' },
    }
  },
  {
    id: '8',
    nameEt: 'Talitluspidevus',
    nameEn: 'Business Continuity',
    clauseEt: '"Teenusepakkuja tagab äritegevuse jätkuvuse plaani olemasolu ja testimise vähemalt [1] kord aastas. Plaan sisaldab taastumise ajaeesmärke (RTO ≤ [4h], RPO ≤ [1h]) ja kriisiolukorras tegutsemise protseduure."',
    clauseEn: '"The provider shall ensure a business continuity plan is in place and tested at least [1] time per year. The plan shall include recovery time objectives (RTO ≤ [4h], RPO ≤ [1h]) and crisis procedures."',
    doraReference: 'Art. 30(2)(h)',
    translations: {
      et: { name: 'Talitluspidevus', clause: '"Teenusepakkuja tagab äritegevuse jätkuvuse plaani olemasolu ja testimise vähemalt [1] kord aastas. Plaan sisaldab taastumise ajaeesmärke (RTO ≤ [4h], RPO ≤ [1h]) ja kriisiolukorras tegutsemise protseduure."' },
      en: { name: 'Business Continuity', clause: '"The provider shall ensure a business continuity plan is in place and tested at least [1] time per year. The plan shall include recovery time objectives (RTO ≤ [4h], RPO ≤ [1h]) and crisis procedures."' },
      de: { name: 'Geschäftskontinuität', clause: '"Der Dienstleister gewährleistet das Vorhandensein und die mindestens [1]-mal jährliche Prüfung eines Geschäftskontinuitätsplans. Der Plan umfasst Wiederherstellungszeitziele (RTO ≤ [4h], RPO ≤ [1h]) und Krisenverfahren."' },
      fr: { name: 'Continuité des activités', clause: '"Le prestataire assure l\'existence et le test d\'un plan de continuité des activités au moins [1] fois par an. Le plan comprend les objectifs de temps de reprise (RTO ≤ [4h], RPO ≤ [1h]) et les procédures de crise."' },
      nl: { name: 'Bedrijfscontinuïteit', clause: '"De dienstverlener waarborgt een bedrijfscontinuïteitsplan dat ten minste [1] keer per jaar wordt getest. Het plan omvat hersteltijddoelstellingen (RTO ≤ [4u], RPO ≤ [1u]) en crisisprocedures."' },
      pl: { name: 'Ciągłość działania', clause: '"Dostawca zapewnia istnienie i testowanie planu ciągłości działania co najmniej [1] raz w roku. Plan obejmuje cele czasu odtworzenia (RTO ≤ [4h], RPO ≤ [1h]) oraz procedury kryzysowe."' },
      es: { name: 'Continuidad del negocio', clause: '"El proveedor garantizará la existencia y prueba de un plan de continuidad de negocio al menos [1] vez al año. El plan incluirá objetivos de tiempo de recuperación (RTO ≤ [4h], RPO ≤ [1h]) y procedimientos de crisis."' },
      it: { name: 'Continuità operativa', clause: '"Il fornitore garantisce l\'esistenza e il test di un piano di continuità operativa almeno [1] volta all\'anno. Il piano comprende gli obiettivi di tempo di ripristino (RTO ≤ [4h], RPO ≤ [1h]) e le procedure di crisi."' },
    }
  }
];

// Helper to get clause by requirement ID
export function getModelClause(requirementId: number | string): ModelClause | undefined {
  return MODEL_CLAUSES.find(c => c.id === String(requirementId));
}

// Get clause name/text for a specific language
export function getClauseName(clause: ModelClause, lang: ClauseLanguage): string {
  return clause.translations[lang]?.name || clause.nameEn;
}

export function getClauseText(clause: ModelClause, lang: ClauseLanguage): string {
  return clause.translations[lang]?.clause || clause.clauseEn;
}
