import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Film, 
  Tv, 
  Star, 
  TrendingUp,
  ExternalLink,
  Award
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string;
  deathday: string | null;
  placeOfBirth: string;
  profilePath: string;
  knownForDepartment: string;
  popularity: number;
  knownFor: MovieCredit[];
  filmography: MovieCredit[];
  directingCredits: MovieCredit[];
  stats: {
    totalMovies: number;
    totalShows: number;
    averageRating: string | null;
  };
  externalIds: {
    imdb_id?: string;
    facebook_id?: string;
    instagram_id?: string;
    twitter_id?: string;
  };
}

interface MovieCredit {
  id: number; // TMDB ID
  tmdbId?: number;
  _id?: string; // Our database ID
  inDatabase?: boolean;
  title: string;
  posterPath: string;
  releaseDate: string;
  voteAverage: number;
  character?: string;
  job?: string;
  popularity?: number;
}

const CastDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFilms, setExpandedFilms] = useState(false);
  const [expandedDirecting, setExpandedDirecting] = useState(false);

  useEffect(() => {
    fetchPersonDetails();
  }, [id]);

  const fetchPersonDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/cast/${id}`);
      setPerson(response.data);
    } catch (error) {
      console.error('Error fetching person details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthday: string, deathday: string | null) => {
    const birth = new Date(birthday);
    const end = deathday ? new Date(deathday) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Person not found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[60vh] bg-gradient-to-b from-gray-900 to-black">
        {person.profilePath && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/w1280${person.profilePath})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}
        <div className="relative z-10 container mx-auto px-6 h-full flex items-end pb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end w-full">
            {/* Profile Image */}
            <div className="w-48 md:w-64 rounded-none overflow-hidden border-4 border-gray-800 shadow-2xl">
              {person.profilePath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w400${person.profilePath}`}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-6xl text-gray-700 font-black">
                  {person.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="mb-4 rounded-none border-gray-700 text-white hover:bg-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 uppercase tracking-wider">
                {person.name}
              </h1>
              <div className="flex flex-wrap gap-4 items-center text-gray-400">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <span className="text-sm uppercase tracking-wide">{person.knownForDepartment}</span>
                </div>
                {person.birthday && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{person.birthday && calculateAge(person.birthday, person.deathday)} years old</span>
                  </div>
                )}
                {person.placeOfBirth && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{person.placeOfBirth}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-6 py-8 space-y-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black border border-gray-800 rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Total Movies</p>
                  <p className="text-3xl font-bold text-white">{person.stats.totalMovies}</p>
                </div>
                <Film className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border border-gray-800 rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Total Shows</p>
                  <p className="text-3xl font-bold text-white">{person.stats.totalShows}</p>
                </div>
                <Tv className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border border-gray-800 rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Average Rating</p>
                  <p className="text-3xl font-bold text-white">
                    {person.stats.averageRating || 'N/A'}
                  </p>
                </div>
                <Star className="h-12 w-12 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Biography */}
        {person.biography && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Biography</h2>
            </div>
            <Card className="bg-black border border-gray-800 rounded-none">
              <CardContent className="p-8">
                <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                  {person.biography}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Known For */}
        {person.knownFor.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <TrendingUp className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Known For</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {person.knownFor.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => movie._id && navigate(`/movie/${movie._id}`)}
                  className={`group bg-black border ${movie._id ? 'border-gray-800 hover:border-red-600 cursor-pointer' : 'border-gray-900 opacity-60'} rounded-none overflow-hidden transition-all duration-300 ${movie._id ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-gray-950">
                    {movie.posterPath ? (
                      <>
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl font-black">
                        {movie.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{movie.voteAverage.toFixed(1)}</span>
                    </div>
                    {!movie._id && (
                      <div className="absolute top-2 left-2 bg-red-600/90 px-2 py-1">
                        <span className="text-white text-xs font-bold uppercase">Not Available</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-900">
                    <h4 className={`font-bold text-sm mb-1 uppercase tracking-wide truncate transition-colors ${movie._id ? 'text-white group-hover:text-red-600' : 'text-gray-600'}`}>
                      {movie.title}
                    </h4>
                    <p className="text-gray-600 text-xs uppercase tracking-wide truncate">{movie.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filmography */}
        {person.filmography.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <Film className="h-8 w-8 text-red-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Filmography</h2>
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="text-gray-500 text-sm uppercase tracking-wide">{person.filmography.length} Roles</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(expandedFilms ? person.filmography : person.filmography.slice(0, 12)).map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => movie._id && navigate(`/movie/${movie._id}`)}
                  className={`group bg-black border ${movie._id ? 'border-gray-800 hover:border-red-600 cursor-pointer' : 'border-gray-900 opacity-60'} rounded-none overflow-hidden transition-all duration-300 ${movie._id ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-gray-950">
                    {movie.posterPath ? (
                      <>
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl font-black">
                        {movie.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{movie.voteAverage.toFixed(1)}</span>
                    </div>
                    {!movie._id && (
                      <div className="absolute top-2 left-2 bg-red-600/90 px-2 py-1">
                        <span className="text-white text-xs font-bold uppercase">Not Available</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-900">
                    <h4 className={`font-bold text-sm mb-1 uppercase tracking-wide truncate transition-colors ${movie._id ? 'text-white group-hover:text-red-600' : 'text-gray-600'}`}>
                      {movie.title}
                    </h4>
                    <p className="text-gray-600 text-xs uppercase tracking-wide truncate">{movie.character || movie.job}</p>
                  </div>
                </div>
              ))}
            </div>
            {person.filmography.length > 12 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setExpandedFilms(!expandedFilms)}
                  className="bg-black border border-gray-800 hover:border-red-600 text-white px-8 py-3 rounded-none uppercase tracking-wide font-bold transition-all"
                >
                  {expandedFilms ? 'Show Less' : `View All Films (${person.filmography.length})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Directing Credits */}
        {person.directingCredits.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <Award className="h-8 w-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Directed By</h2>
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="text-gray-500 text-sm uppercase tracking-wide">{person.directingCredits.length} Films</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(expandedDirecting ? person.directingCredits : person.directingCredits.slice(0, 12)).map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => movie._id && navigate(`/movie/${movie._id}`)}
                  className={`group bg-black border ${movie._id ? 'border-gray-800 hover:border-blue-600 cursor-pointer' : 'border-gray-900 opacity-60'} rounded-none overflow-hidden transition-all duration-300 ${movie._id ? 'hover:scale-105' : 'cursor-not-allowed'}`}
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-gray-950">
                    {movie.posterPath ? (
                      <>
                        <img
                          src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl font-black">
                        {movie.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-white text-xs font-bold">{movie.voteAverage.toFixed(1)}</span>
                    </div>
                    {!movie._id && (
                      <div className="absolute top-2 left-2 bg-red-600/90 px-2 py-1">
                        <span className="text-white text-xs font-bold uppercase">Not Available</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-900">
                    <h4 className={`font-bold text-sm mb-1 uppercase tracking-wide truncate transition-colors ${movie._id ? 'text-white group-hover:text-blue-600' : 'text-gray-600'}`}>
                      {movie.title}
                    </h4>
                    <p className="text-gray-600 text-xs uppercase tracking-wide">{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : ''}</p>
                  </div>
                </div>
              ))}
            </div>
            {person.directingCredits.length > 12 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={() => setExpandedDirecting(!expandedDirecting)}
                  className="bg-black border border-gray-800 hover:border-blue-600 text-white px-8 py-3 rounded-none uppercase tracking-wide font-bold transition-all"
                >
                  {expandedDirecting ? 'Show Less' : `View All Directing Credits (${person.directingCredits.length})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {(person.externalIds.imdb_id || person.externalIds.instagram_id || person.externalIds.twitter_id || person.externalIds.facebook_id) && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-red-600"></div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Follow</h2>
            </div>
            <div className="flex gap-4">
              {person.externalIds.imdb_id && (
                <Button
                  onClick={() => window.open(`https://www.imdb.com/name/${person.externalIds.imdb_id}`, '_blank')}
                  className="bg-black border border-gray-800 hover:border-yellow-600 text-white rounded-none uppercase tracking-wide"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  IMDB
                </Button>
              )}
              {person.externalIds.instagram_id && (
                <Button
                  onClick={() => window.open(`https://www.instagram.com/${person.externalIds.instagram_id}`, '_blank')}
                  className="bg-black border border-gray-800 hover:border-pink-600 text-white rounded-none uppercase tracking-wide"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
              )}
              {person.externalIds.twitter_id && (
                <Button
                  onClick={() => window.open(`https://twitter.com/${person.externalIds.twitter_id}`, '_blank')}
                  className="bg-black border border-gray-800 hover:border-blue-600 text-white rounded-none uppercase tracking-wide"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
              )}
              {person.externalIds.facebook_id && (
                <Button
                  onClick={() => window.open(`https://www.facebook.com/${person.externalIds.facebook_id}`, '_blank')}
                  className="bg-black border border-gray-800 hover:border-blue-600 text-white rounded-none uppercase tracking-wide"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CastDetailPage;
