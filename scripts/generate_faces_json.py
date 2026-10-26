import json
import random

random.seed(42)
total_photos = 895
all_files = [f"{i:03d}.jpg" for i in range(1, total_photos + 1)]

# Phân bổ ảnh cho từng nhóm nhân vật
groom_indices = sorted(list(set([i for i in range(total_photos) if i % 4 in (0, 1) or i in range(0, 150, 2)])))
bride_indices = sorted(list(set([i for i in range(total_photos) if i % 4 in (1, 2) or i in range(50, 250, 2)])))
couple_indices = sorted(list(set(groom_indices) & set(bride_indices)))
family_indices = sorted(list(set([i for i in range(120, 480) if i % 3 == 0])))
friends_indices = sorted(list(set([i for i in range(350, 750) if i % 4 == 0])))
guests_indices = sorted(list(set([i for i in range(500, 895) if i % 5 == 0])))

data = {
    "version": "1.0",
    "totalPhotos": total_photos,
    "generatedAt": "2026-10-26T10:00:00.000Z",
    "groups": [
        {
            "id": "person_1",
            "name": "Chú rể",
            "role": "groom",
            "avatar": "/wedding/faces/person_1.jpg",
            "count": len(groom_indices),
            "photoIndices": groom_indices,
            "photos": [all_files[i] for i in groom_indices]
        },
        {
            "id": "person_2",
            "name": "Cô dâu",
            "role": "bride",
            "avatar": "/wedding/faces/person_2.jpg",
            "count": len(bride_indices),
            "photoIndices": bride_indices,
            "photos": [all_files[i] for i in bride_indices]
        },
        {
            "id": "person_3",
            "name": "Cô dâu & Chú rể",
            "role": "couple",
            "avatar": "/wedding/faces/person_3.jpg",
            "count": len(couple_indices),
            "photoIndices": couple_indices,
            "photos": [all_files[i] for i in couple_indices]
        },
        {
            "id": "person_4",
            "name": "Gia đình",
            "role": "family",
            "avatar": "/wedding/faces/person_4.jpg",
            "count": len(family_indices),
            "photoIndices": family_indices,
            "photos": [all_files[i] for i in family_indices]
        },
        {
            "id": "person_5",
            "name": "Bạn bè & Phù dâu/rể",
            "role": "friends",
            "avatar": "/wedding/faces/person_5.jpg",
            "count": len(friends_indices),
            "photoIndices": friends_indices,
            "photos": [all_files[i] for i in friends_indices]
        },
        {
            "id": "person_6",
            "name": "Khách mời tiệc cưới",
            "role": "guests",
            "avatar": "/wedding/faces/person_6.jpg",
            "count": len(guests_indices),
            "photoIndices": guests_indices,
            "photos": [all_files[i] for i in guests_indices]
        }
    ]
}

with open("public/wedding/faces.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Generated public/wedding/faces.json with {len(data['groups'])} groups.")
for g in data["groups"]:
    print(f" - {g['name']}: {g['count']} ảnh")
