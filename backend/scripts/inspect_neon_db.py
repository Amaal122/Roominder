from sqlalchemy import create_engine, text

from backend.config import settings

engine = create_engine(settings.sqlalchemy_database_url, pool_pre_ping=True)

queries = {
    "database_and_user": "select current_database(), current_user, current_schema()",
    "schemas": """
        select schema_name
        from information_schema.schemata
        order by schema_name
    """,
    "public_tables": """
        select table_name
        from information_schema.tables
        where table_schema = 'public'
        order by table_name
    """,
    "all_tables": """
        select table_schema, table_name
        from information_schema.tables
        where table_type = 'BASE TABLE'
        order by table_schema, table_name
    """,
}

with engine.connect() as conn:
    for name, sql in queries.items():
        print(f"\n--- {name} ---")
        rows = conn.execute(text(sql)).fetchall()
        for row in rows:
            print(row)
