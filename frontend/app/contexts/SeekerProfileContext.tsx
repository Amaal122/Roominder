import { createContext, ReactNode, useContext, useState } from "react";

type SeekerProfile = {
  looking_for?: "roommate" | "house" | "both";
  location?: string;
  radius?: number;
  age?: number;
  gender?: string;
  occupation?: string;
  image_url?: string;
  sleep_schedule?: "early" | "late";
  cleanliness?: boolean;
  social_life?: boolean;
  guests?: boolean;
  work_style?: boolean;
};

type SeekerProfileContextType = {
  profile: SeekerProfile;
  updateProfile: (data: Partial<SeekerProfile>) => void;
  resetProfile: () => void;
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

  const updateProfile = (data: Partial<SeekerProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  const resetProfile = () => setProfile({});

  return (
    <SeekerProfileContext.Provider
      value={{ profile, updateProfile, resetProfile }}
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
