import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getAuthToken } from "../state/auth"; // adjust path
type SeekerProfile = {
  looking_for?: "roommate" | "house" | "both";
  location?: string;
  radius?: number;
  age?: number;
  gender?: string;
  occupation?: string;
  image_url?: string;
  sleep_schedule?: string;
  cleanliness?: string;
  social_life?: string;
  guests?: string;
  work_style?: string;
};

type SeekerProfileContextType = {
  profile: SeekerProfile;
  updateProfile: (data: Partial<SeekerProfile>) => void;
  resetProfile: () => void;
  loaded: boolean;
};

const SeekerProfileContext = createContext<
  SeekerProfileContextType | undefined
>(undefined);

export const SeekerProfileProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [profile, setProfile] = useState<SeekerProfile>({});
  const [loaded, setLoaded] = useState(false);

  const resetProfile = () => setProfile({});
  // ✅ Load profile from backend on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch("http://127.0.0.1:8001/seeker/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error("Failed to load seeker profile", e);
      } finally {
        setLoaded(true);
      }
    };

    loadProfile();
  }, []);
  const updateProfile = (data: Partial<SeekerProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  return (
    <SeekerProfileContext.Provider
      value={{ profile, updateProfile, resetProfile, loaded }}
    >
      {children}
    </SeekerProfileContext.Provider>
  );
};

export const useSeekerProfile = () => {
  const context = useContext(SeekerProfileContext);
  if (!context)
    throw new Error(
      "useSeekerProfile must be used within a SeekerProfileProvider",
    );
  return context;
};
