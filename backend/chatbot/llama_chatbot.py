"""Chatbot Roominder — Groq API (Owner et Seeker)."""

import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MODELS = {
    "property_owner": "llama-3.1-8b-instant",
"tenant":         "llama-3.1-8b-instant",
}

OWNER_SYSTEM = """
Tu es OwnerBot, l'assistant dédié aux PROPRIÉTAIRES de l'application Roominder.
Roominder est une plateforme tunisienne de matching de colocataires.

Tu aides UNIQUEMENT les propriétaires avec :
- Gestion de leurs propriétés (ajouter, modifier, supprimer)
- Suivi des demandes de location (accepter, refuser)
- Consultation des statistiques (revenus, taux d'occupation)
- Planification des visites
- Communication avec les locataires

Règles :
- Réponds en français ou en tunisien selon la langue de l'utilisateur
- Sois concis : maximum 3-4 phrases
- Ne réponds pas aux questions hors Roominder
- Monnaie : Dinar Tunisien (DT)
- Si tu ne sais pas, dis-le honnêtement
"""

SEEKER_SYSTEM = """
Tu es SeekerBot, l'assistant dédié aux LOCATAIRES de l'application Roominder.
Roominder est une plateforme tunisienne de matching de colocataires.

Tu aides UNIQUEMENT les locataires avec :
- Recherche de logements compatibles (utilise UNIQUEMENT les logements fournis dans le contexte)
- Recherche et suggestion de colocataires (utilise UNIQUEMENT les colocataires fournis dans le contexte)
- Compréhension du système de matching (budget 35%, localisation 30%, chambres 20%, style de vie 15%)
- Gestion du profil de lifestyle
- Candidature pour des logements
- Communication avec les propriétaires

Règles :
- Réponds en français ou en tunisien selon la langue de l'utilisateur
- Sois concis : maximum 3-4 phrases
- Ne réponds pas aux questions hors Roominder
- Monnaie : Dinar Tunisien (DT)
- Si l'utilisateur cherche un logement et donne une ville, propose les logements disponibles dans cette ville, meme si le budget n'est pas donne.
- Demande le budget seulement pour affiner les resultats, pas pour bloquer la reponse.
- Si on te demande des colocataires, propose UNIQUEMENT ceux listés dans la section 'Colocataires disponibles' du contexte. Ne les invente jamais.
- RÈGLE ABSOLUE ET STRICTE : N'invente JAMAIS de logements. Ne propose STRICTEMENT que les logements présents dans la section 'Logements disponibles'.
- Si l'utilisateur demande une ville spécifique, et que les logements dans la section 'Logements disponibles' ne sont pas dans cette ville, TU DOIS DIRE qu'il n'y a pas de logements dans cette ville. NE LUI PROPOSE PAS les autres logements en lui faisant croire qu'ils sont dans sa ville.
- S'il n'y a pas de logement correspondant EXACTEMENT aux autres critères (ex: budget), tu peux proposer ceux du contexte, MAIS précise bien pourquoi (ex: "Je n'ai pas pour ce budget, mais voici ce que j'ai à <Ville>").
"""

OWNER_CONTEXT = """
Données actuelles du propriétaire :
- Propriétés : {total_properties}
- Revenu mensuel : {monthly_revenue} DT
- Demandes en attente : {pending_count}
- Taux d'occupation : {occupancy_percent}%
"""

SEEKER_CONTEXT = """
Profil du locataire :
- Budget : {budget} DT
- Ville souhaitée : {city}
- Chambres souhaitées : {rooms_needed}

{properties_context}

IMPORTANT : Si l'utilisateur cherche un logement, utilise UNIQUEMENT les logements listés ci-dessus pour répondre. Ne invente pas de logements !
"""
def _is_housing_search(message: str) -> bool:
    text = message.lower()
    search_words = (
        "logement", "logements", "maison", "maisons", "appartement", "appart",
        "studio", "chambre", "location", "louer", "cherche", "chercher",
        "choix", "options", "available", "housing", "house", "home",
        "dar", "bit", "nheb", "n7eb", "kra", "kira", "nekri",
    )
    return any(word in text for word in search_words)


def _greeting_for(message: str) -> str:
    text = message.lower()
    if any(word in text for word in ("bon apres midi", "bon après midi", "bon apres-midi", "bon après-midi")):
        return "Bon après-midi"
    if any(word in text for word in ("bonsoir", " مساء", "masa")):
        return "Bonsoir"
    if any(word in text for word in ("salut", "hello", "hi", "ahla", "aslema")):
        return "Bonjour"
    return "Bonjour"


def _local_fallback(message: str, user_role: str, user_data: dict = None) -> str:
    """Return a useful answer when Groq is not configured or unavailable."""

    user_data = user_data or {}
    text = message.lower().strip()

    if user_role != "property_owner":
        selected_property = user_data.get("selected_property")
        if selected_property:
            description = selected_property.get("description") or "Description non disponible dans la base."
            selected_label = user_data.get("selected_property_label", "logement choisi")
            return (
                f"Bien sur. Le {selected_label} est {selected_property['title']} a {selected_property['city']}.\n"
                f"Prix: {float(selected_property['price']):.0f} DT/mois. "
                f"Chambres: {selected_property['rooms']}. "
                f"Adresse: {selected_property['address']}.\n"
                f"Description: {description}\n"
                "Vous pouvez ouvrir la fiche ou demander une visite avec les boutons ci-dessous."
            )

        properties = user_data.get("properties") or []
        if properties and _is_housing_search(message):
            budget = user_data.get("budget")
            city = user_data.get("city", "la ville demandee")
            intro = f"Voici les logements disponibles a {city}"
            if isinstance(budget, (int, float)):
                intro += f" avec un budget jusqu'a {float(budget):.0f} DT"
            lines = [intro + " :"]
            for prop in properties[:5]:
                lines.append(
                    f"- {prop['title']} a {prop['city']} : {float(prop['price']):.0f} DT, "
                    f"{prop['rooms']} chambre(s), adresse: {prop['address']}."
                )
            lines.append("Donnez-moi votre budget si vous voulez que je filtre encore plus.")
            return "\n".join(lines)

        properties_context = user_data.get("properties_context", "")
        if _is_housing_search(message) and "Aucun logement" in properties_context:
            city = user_data.get("city", "cette ville")
            return (
                f"Je n'ai pas trouve de logement disponible pour {city}. "
                "Essayez une autre ville ou un budget different."
            )

    greeting_words = (
        "bonjour", "bonsoir", "bon apres midi", "bon après midi",
        "bon apres-midi", "bon après-midi", "salut", "hello", "hi",
        "ahla", "aslema",
    )
    if any(word in text for word in greeting_words):
        greeting = _greeting_for(message)
        if user_role == "property_owner":
            total = user_data.get("total_properties", 0)
            pending = user_data.get("pending_count", 0)
            return (
                f"{greeting} ! Vous avez {total} propriete(s) et {pending} demande(s) en attente. "
                "Je peux vous aider avec vos annonces, visites, demandes ou statistiques."
            )
        return (
            f"{greeting} ! Je peux vous aider a chercher un logement ou un colocataire. "
            "Donnez-moi la ville et votre budget pour affiner les resultats."
        )

    if user_role == "property_owner":
        total = user_data.get("total_properties", 0)
        monthly = user_data.get("monthly_revenue", 0)
        pending = user_data.get("pending_count", 0)
        occupancy = user_data.get("occupancy_percent", 0)
        return (
            f"Resume proprietaire : {total} propriete(s), {pending} demande(s) en attente, "
            f"{monthly} DT de revenu mensuel et {occupancy}% d'occupation. "
            "Dites-moi ce que vous voulez gerer."
        )

    selected_property = user_data.get("selected_property")
    if selected_property:
        description = selected_property.get("description") or "Description non disponible dans la base."
        selected_label = user_data.get("selected_property_label", "logement choisi")
        return (
            f"Bien sur. Le {selected_label} est {selected_property['title']} a {selected_property['city']}.\n"
            f"Prix: {float(selected_property['price']):.0f} DT/mois. "
            f"Chambres: {selected_property['rooms']}. "
            f"Adresse: {selected_property['address']}.\n"
            f"Description: {description}\n"
            "Vous pouvez ouvrir la fiche ou demander une visite avec les boutons ci-dessous."
        )

    properties = user_data.get("properties") or []
    if properties and _is_housing_search(message):
        budget = user_data.get("budget")
        city = user_data.get("city", "la ville demandee")
        intro = f"Voici ce que j'ai trouve pour {city}"
        if isinstance(budget, (int, float)):
            intro += f" avec un budget jusqu'a {float(budget):.0f} DT"
        lines = [intro + " :"]
        for prop in properties[:3]:
            lines.append(
                f"- {prop['title']} a {prop['city']} : {float(prop['price']):.0f} DT, "
                f"{prop['rooms']} chambre(s), adresse: {prop['address']}."
            )
        lines.append("Vous voulez que je vous aide a choisir le meilleur ou a envoyer une candidature ?")
        return "\n".join(lines)

    properties_context = user_data.get("properties_context", "")
    if _is_housing_search(message) and "Aucun logement" in properties_context:
        city = user_data.get("city", "cette ville")
        return (
            f"Je n'ai pas trouve de logement disponible pour {city}. "
            "Essayez une autre ville ou un budget different."
        )
    if _is_housing_search(message) and "Logements disponibles" in properties_context:
        return (
            "J'ai trouve des logements disponibles dans la base. "
            "Indiquez votre budget, la ville ou le nombre de chambres pour que je vous propose les meilleurs choix."
        )

    return (
        "Je peux vous aider sur Roominder. Pour chercher un logement, envoyez-moi la ville, "
        "le budget et le nombre de chambres souhaite."
    )


def chat(
    message: str,
    history: list = None,
    user_role: str = "tenant",
    user_data: dict = None,
) -> str:

    model = MODELS.get(user_role, "llama3-8b-8192")
    if user_role != "property_owner" and user_data and user_data.get("selected_property"):
        return _local_fallback(message, user_role, user_data)
    if user_role != "property_owner" and user_data and user_data.get("properties") and _is_housing_search(message):
        return _local_fallback(message, user_role, user_data)
    if (
        user_role != "property_owner"
        and user_data
        and _is_housing_search(message)
        and "Aucun logement" in user_data.get("properties_context", "")
    ):
        return _local_fallback(message, user_role, user_data)

    # Prépare le system prompt
    if user_role == "property_owner":
        system = OWNER_SYSTEM
        if user_data:
            system += OWNER_CONTEXT.format(**user_data)
    else:
        system = SEEKER_SYSTEM
        if user_data:
            system += SEEKER_CONTEXT.format(
                budget=user_data.get("budget", "non défini"),
                city=user_data.get("city", "non définie"),
                rooms_needed=user_data.get("rooms_needed", 1),
                properties_context=user_data.get("properties_context", "Aucun logement disponible."),
            )
    # Prépare les messages
    messages = [{"role": "system", "content": system}]

    if history:
        for msg in history[-10:]:
            messages.append(msg)

    messages.append({"role": "user", "content": message})

    if client is None:
        return _local_fallback(message, user_role, user_data)

    # Appelle Groq
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=300,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ Groq error: {e}")
        return _local_fallback(message, user_role, user_data)
