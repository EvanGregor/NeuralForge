"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { User, MapPin, Mail, Github, Linkedin, Globe, Pencil, Plus, Save, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ProfileData {
    full_name: string
    company: string
    location: string
    bio: string
    linkedin_url: string
    github_url: string
    website_url: string
    skills: string[]
    languages: { name: string; level: string }[]
}

export default function ProfilePage() {
    const { user } = useAuth()
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<ProfileData>({
        full_name: '',
        company: '',
        location: '',
        bio: '',
        linkedin_url: '',
        github_url: '',
        website_url: '',
        skills: [],
        languages: []
    })
    const [newSkill, setNewSkill] = useState("")
    const [newLanguage, setNewLanguage] = useState({ name: "", level: "Professional" })

    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) {
                setLoading(false)
                return
            }

            try {
                // Load from user_profiles table
                const { data: profileData, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.error('Error loading profile:', error)
                }

                // Get user metadata from auth
                const userMetadata = user.user_metadata || {}
                
                // Set profile data
                setProfile({
                    full_name: profileData?.full_name || userMetadata.full_name || user.email?.split('@')[0] || '',
                    company: profileData?.company || userMetadata.company || '',
                    location: userMetadata.location || '',
                    bio: userMetadata.bio || '',
                    linkedin_url: userMetadata.linkedin_url || '',
                    github_url: userMetadata.github_url || '',
                    website_url: userMetadata.website_url || '',
                    skills: userMetadata.skills || [],
                    languages: userMetadata.languages || []
                })
            } catch (error) {
                console.error('Error loading profile:', error)
                // Set defaults from user metadata
                const userMetadata = user.user_metadata || {}
                setProfile({
                    full_name: userMetadata.full_name || user.email?.split('@')[0] || '',
                    company: userMetadata.company || '',
                    location: userMetadata.location || '',
                    bio: userMetadata.bio || '',
                    linkedin_url: userMetadata.linkedin_url || '',
                    github_url: userMetadata.github_url || '',
                    website_url: userMetadata.website_url || '',
                    skills: userMetadata.skills || [],
                    languages: userMetadata.languages || []
                })
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [user])

    const handleSave = async () => {
        if (!user?.id) {
            toast.error('Please log in to save your profile')
            return
        }

        setSaving(true)
        try {
            // Update user_profiles table
            const { error: profileError } = await supabase
                .from('user_profiles')
                .upsert({
                    id: user.id,
                    full_name: profile.full_name,
                    company: profile.company,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                })

            if (profileError) {
                console.error('Error updating profile:', profileError)
                toast.error('Failed to update profile')
                setSaving(false)
                return
            }

            // Update auth user metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    full_name: profile.full_name,
                    company: profile.company,
                    location: profile.location,
                    bio: profile.bio,
                    linkedin_url: profile.linkedin_url,
                    github_url: profile.github_url,
                    website_url: profile.website_url,
                    skills: profile.skills,
                    languages: profile.languages
                }
            })

            if (authError) {
                console.error('Error updating auth metadata:', authError)
                toast.error('Profile updated but metadata update failed')
            } else {
                toast.success('Profile updated successfully!')
                setIsEditing(false)
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.error('Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    const addSkill = () => {
        if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
            setProfile({
                ...profile,
                skills: [...profile.skills, newSkill.trim()]
            })
            setNewSkill("")
        }
    }

    const removeSkill = (skill: string) => {
        setProfile({
            ...profile,
            skills: profile.skills.filter(s => s !== skill)
        })
    }

    const addLanguage = () => {
        if (newLanguage.name.trim()) {
            setProfile({
                ...profile,
                languages: [...profile.languages, { ...newLanguage }]
            })
            setNewLanguage({ name: "", level: "Professional" })
        }
    }

    const removeLanguage = (index: number) => {
        setProfile({
            ...profile,
            languages: profile.languages.filter((_, i) => i !== index)
        })
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    const avatarSeed = profile.full_name || user?.email || 'user'
    const displayName = profile.full_name || user?.email?.split('@')[0] || 'User'
    const displayEmail = user?.email || ''

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* ========== PROFILE HEADER ========== */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />

                <div className="px-8 pb-8">
                    <div className="flex justify-between items-start -mt-12 mb-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        </div>
                        <div className="mt-14">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Button onClick={handleSave} disabled={saving}>
                                        <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                                        <X className="w-4 h-4 mr-2" /> Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>

                    <div>
                        {isEditing ? (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="company">Company / Title</Label>
                                    <Input
                                        id="company"
                                        value={profile.company}
                                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                        placeholder="e.g., Senior Developer at TechFlow"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                                <p className="text-lg text-gray-600">{profile.company || 'No title set'}</p>
                            </>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                            {isEditing ? (
                                <div className="w-full">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={profile.location}
                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                        placeholder="e.g., San Francisco, CA"
                                        className="mt-1"
                                    />
                                </div>
                            ) : (
                                profile.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" /> {profile.location}
                                    </span>
                                )
                            )}
                            <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" /> {displayEmail}
                            </span>
                            {!isEditing && profile.linkedin_url && (
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                                    <Linkedin className="w-4 h-4" /> LinkedIn
                                </a>
                            )}
                            {!isEditing && profile.github_url && (
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                                    <Github className="w-4 h-4" /> GitHub
                                </a>
                            )}
                            {!isEditing && profile.website_url && (
                                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                                    <Globe className="w-4 h-4" /> Website
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ========== MAIN CONTENT ========== */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* About */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">About</h2>
                        </div>
                        {isEditing ? (
                            <Textarea
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                placeholder="Tell us about yourself..."
                                className="min-h-[120px]"
                            />
                        ) : (
                            <p className="text-gray-600 leading-relaxed">
                                {profile.bio || 'No bio added yet. Click Edit Profile to add one.'}
                            </p>
                        )}
                    </div>

                    {/* Social Links (Editing Mode) */}
                    {isEditing && (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Social Links</h2>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                                    <Input
                                        id="linkedin_url"
                                        value={profile.linkedin_url}
                                        onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="github_url">GitHub URL</Label>
                                    <Input
                                        id="github_url"
                                        value={profile.github_url}
                                        onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                                        placeholder="https://github.com/yourusername"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="website_url">Website URL</Label>
                                    <Input
                                        id="website_url"
                                        value={profile.website_url}
                                        onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Skills */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Skills</h2>
                        </div>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                        placeholder="Add a skill"
                                    />
                                    <Button onClick={addSkill} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-2">
                                            {skill}
                                            <button onClick={() => removeSkill(skill)} className="hover:text-red-600">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.length > 0 ? (
                                    profile.skills.map((skill, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No skills added yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Languages */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Languages</h2>
                        </div>
                        {isEditing ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={newLanguage.name}
                                        onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                                        placeholder="Language name"
                                        className="flex-1"
                                    />
                                    <select
                                        value={newLanguage.level}
                                        onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="Native">Native</option>
                                        <option value="Professional">Professional</option>
                                        <option value="Conversational">Conversational</option>
                                        <option value="Basic">Basic</option>
                                    </select>
                                    <Button onClick={addLanguage} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {profile.languages.map((lang, idx) => (
                                        <li key={idx} className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">{lang.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-500">{lang.level}</span>
                                                <button onClick={() => removeLanguage(idx)} className="text-red-500 hover:text-red-700">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {profile.languages.length > 0 ? (
                                    profile.languages.map((lang, idx) => (
                                        <li key={idx} className="flex justify-between">
                                            <span className="text-gray-700 font-medium">{lang.name}</span>
                                            <span className="text-gray-500">{lang.level}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No languages added yet</p>
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
