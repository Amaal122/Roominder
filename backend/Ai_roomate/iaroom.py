"""Small compatibility helpers for roommate AI vector values."""


def array(values, dtype=None):
    caster = dtype or (lambda value: value)
    return [caster(value) for value in values]


float32 = float
int32 = int
