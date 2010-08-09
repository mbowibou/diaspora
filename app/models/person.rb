class Person
  include MongoMapper::Document
  include ROXML

  xml_accessor :_id
  xml_accessor :email
  xml_accessor :url
  xml_accessor :serialized_key
  xml_accessor :profile, :as => Profile
  
  
  key :email, String
  key :url, String
  key :active, Boolean, :default => false

  key :serialized_key, String 

  one :profile, :class_name => 'Profile'
  many :posts, :class_name => 'Post', :foreign_key => :person_id
  many :albums, :class_name => 'Album', :foreign_key => :person_id

  timestamps!

  before_validation :clean_url
  validates_presence_of :email, :url, :serialized_key
  validates_format_of :url, :with =>
     /^(https?):\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*(\.[a-z]{2,5})?(:[0-9]{1,5})?(\/.*)?$/ix
  
  validates_true_for :url, :logic => lambda { self.url_unique?}

  after_destroy :remove_all_traces

  scope :friends, where(:_type => "Person", :active => true)
  
  def self.search_for_friends(query)
    Person.all('$where' => "function() { return this.profile.first_name.match(/^#{query}/i) || this.profile.last_name.match(/^#{query}/i); }")
  end
 
  def real_name
    "#{profile.first_name.to_s} #{profile.last_name.to_s}"
  end

  def key
    OpenSSL::PKey::RSA.new( serialized_key )
  end

  def key= new_key
    raise TypeError unless new_key.class == OpenSSL::PKey::RSA
    serialized_key = new_key.export
  end
  def export_key
    key.public_key.export
  end

  protected
  
  def url_unique?
    same_url = Person.first(:url => self.url)
    return same_url.nil? || same_url.id == self.id
  end

  def clean_url
    self.url ||= "http://localhost:3000/" if self.class == User
    if self.url
      self.url = 'http://' + self.url unless self.url.match('http://' || 'https://')
      self.url = self.url + '/' if self.url[-1,1] != '/'
    end
  end

  private

  def remove_all_traces
    self.posts.delete_all
  end

 end
