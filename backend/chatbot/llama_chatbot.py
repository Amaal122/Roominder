"""Chatbot Roominder — Groq API (Owner et Seeker)."""

import os
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

client = Groq(api_key=GROQ_API_KEY)

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
- Toujours demander budget ET ville si l'utilisateur cherche un logement
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


def chat(
    message: str,
    history: list = None,
    user_role: str = "tenant",
    user_data: dict = None,
) -> str:

    model = MODELS.get(user_role, "llama3-8b-8192")

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
        return "Désolé, je rencontre un problème technique. Réessayez dans quelques instants."