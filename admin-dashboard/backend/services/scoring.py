def calculate_score(device_exists, ip):

    score = 0

    if device_exists:
        score += 30
    else:
        score += 10

    suspicious_ips = ["127.0.0.1"]

    if ip not in suspicious_ips:
        score += 20

    if score >= 40:
        status = "verified"
    else:
        status = "manual_review"

    return score, status